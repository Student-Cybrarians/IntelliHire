# IntelliHire M2 Universal Evidence Engine — Security Baseline

**Date:** 2026-10-02  
**Role:** Security / Privacy Lead + Solution Architect  
**Scope:** Authentication, Authorization, Tenant Isolation, Injection, Secrets, PII, and Audit Controls  

---

## 1. Authentication vs. Authorization vs. Tenant Isolation

The architecture strictly distinguishes these three security boundaries:

```
Request arrives
  │
  ├── 1. Authentication (Who are you?)
  │      Validates session cookie / JWT against SESSION_KV
  │      Result: Identified user_account.id (or 401 Unauthorized)
  │
  ├── 2. Tenant Resolution & Isolation (Which organization boundary owns this?)
  │      Looks up organization_id from user_account record
  │      Result: Bound organization_id (or 403 Forbidden)
  │
  └── 3. Authorization (What permissions do you have on this specific object?)
         a. Role Check: candidate vs. recruiter vs. org_admin
         b. Object Ownership: user_id matching attempt/profile
         Result: Execution permitted (or 403/404)
```

### Detailed Mechanism:
1. **Authentication:**
   - Managed via Google OAuth 2.0 and signed HS256 JWTs stored in `SESSION_KV`.
   - Cookie: `intellihire_session`, configured with `httpOnly: true`, `secure: true`, `sameSite: 'Lax'`, `maxAge: 86400`.
   - `getSessionUser(c)` verifies token validity against KV session store.
2. **Tenant Isolation:**
   - Each user is bound to an `organization_id` in `user_account`.
   - Multi-tenant data queries (`assessment_blueprint`, `competency`, `job_requisition`, `evidence_package`, `m2_audit_event`) enforce `WHERE organization_id = ?` or `JOIN` with organization ownership.
   - Cross-tenant data operations fail server-side.
3. **Object-Level Authorization:**
   - Candidate endpoints (`GET /m2/attempts/:id`, `GET /m2/attempts/:id/next`, `POST /m2/attempts/:id/respond`, `POST /m2/attempts/:id/complete`, `GET /m2/proficiency`, `GET /m2/gaps`) explicitly enforce `WHERE user_id = ?`.
   - Attempting to inspect or manipulate another candidate's assessment attempt returns `404 Not Found` or `401 Unauthorized`.

---

## 2. SQL Injection Safety

- **Mechanism:** Cloudflare D1 parameterized statements (`c.env.DB.prepare(...).bind(...)`).
- **Dynamic Queries:**
  - In `GET /m2/attempts/:id/next`, the dynamic `NOT IN` clause is constructed using parameter placeholders:
    ```typescript
    itemQuery += ` AND id NOT IN (${usedItems.map(() => '?').join(',')})`;
    params.push(...usedItems);
    ```
  - All values are bound as query parameters, preventing SQL injection.
- **Audit:** Zero raw string concatenation of user-supplied variables into SQL statements.

---

## 3. Cross-Site Scripting (XSS) & Content Security

- **React Encoding:** React automatically encodes all rendered expressions in JSX children.
- **Source Inspection:** Verified 0 occurrences of `dangerouslySetInnerHTML` across `src/client/`.
- **Markdown / Rich Text:** Resume and assessment text inputs are rendered as text content, not raw HTML.

---

## 4. Cross-Site Request Forgery (CSRF)

- **Cookie Flags:** `SameSite=Lax` prevents CSRF on top-level cross-origin requests.
- **Header Preflight:** State-changing endpoints require `Content-Type: application/json`, which triggers a CORS preflight for cross-origin requests.
- **Origin Validation:** In production, APIs are hosted on the same origin as the frontend (`https://intellihire-v3.pages.dev`).

---

## 5. Prompt Injection & AI Boundary Defense

- **Untrusted Input Classification:**
  - Candidate resume text, submitted answers, and role context inputs are classified as **untrusted user content**.
- **Delimited Prompts:** Inputs to external LLMs (NVIDIA NIM `meta/muse-glimmer-30b`) are wrapped with explicit bounding delimiters (e.g. `--- RESUME TEXT START ---` and `--- RESUME TEXT END ---`).
- **Structured Schema Validation:** Model outputs are strictly parsed and validated against expected JSON schemas before persistence. Any unstructured or unexpected model response is rejected (`500 Malformed AI output`).
- **Phase 5 Upgrade Plan:** Implementation of adversarial persona testing and formal prompt injection sanitization.

---

## 6. Secret Handling & Credential Containment

- **Zero Hardcoding:** No credentials, API tokens, or secrets are committed to Git.
- **Environment Bindings:** Secrets (`NVIDIA_API_KEY`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`) are accessed solely through Cloudflare Pages server-side bindings (`c.env`).
- **Preflight Enforcer:** `scripts/preflight.mjs` scans Git status and untracked files, aborting deployment if `.env` or `.dev.vars` are tracked.

---

## 7. PII Exposure & Privacy Minimization

- **Automated PII Redaction:** The `redactPII()` utility sanitizes text prior to external AI inference:
  - Email addresses: `[EMAIL_REDACTED]`
  - Phone numbers: `[PHONE_REDACTED]`
  - Social Security Numbers: `[SSN_REDACTED]`
  - Street addresses: `[ADDRESS_REDACTED]`
  - Personal profile URLs: `[PROFILE_URL_REDACTED]`
- **Audit & Provenance:** Provenance metadata tracks `pii_categories_redacted` to preserve evidence integrity without leaking personal identifiers.

---

## 8. Auditability & Immutable Event Log

- **Audit Event Table:** `m2_audit_event` records operational events:
  - Event types: `blueprint_create`, `item_generate`, `attempt_start`, `response_submit`, `attempt_complete`, `evidence_package_generate`.
  - Details: Organization ID, User ID, timestamp, target entity, and serialized context.
- **Immutable:** Events are write-only (`INSERT`); no updates or deletes permitted.
