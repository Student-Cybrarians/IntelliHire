# Mismatch Register

Authoritative register of discrepancies identified during the IntelliHire Plan → Implementation → Deployment Audit Loop.

| ID | Date/Time | Domain | Requirement / Area | Planned Behavior | Actual Behavior | Severity | Classification | Status |
|---|---|---|---|---|---|---|---|---|
| MM-001 | 2026-10-02T03:22:00Z | Release | Release Traceability | Local HEAD = Remote Main = Production Pages Deployment | Local: `6cf2ac6`, Remote: `6cf2ac6`, Production: `6cf2ac6` (`0ec4f160`) | HIGH | D4 — Deployment drift / Release sync | **VERIFIED (MATCH)** |
| MM-002 | 2026-10-02T01:53:00Z | Architecture | Asynchronous Processing | Cloudflare Queues Producer/Consumer pipeline | Cloudflare Queues blocked by Workers Free tier; replaced with D1 queue polling & Cron Worker fallback | MEDIUM | D6 — Architecture mismatch (Approved via ADR) | **VERIFIED** (ADR Approved) |
| MM-003 | 2026-10-02T01:53:00Z | Scope | Module Isolation | Module 1 authorized; Module 2 unauthorized | M2 assessment tables and routes were committed in `cfadf09` | HIGH | D10 — Scope violation | **QUARANTINED** |
| MM-004 | 2026-10-02T01:53:00Z | Routing | Cloudflare Pages SPA Fallback | Clean SPA navigation without infinite redirects | `public/_redirects` had `/* /index.html 200` causing infinite loop warning | MEDIUM | D2 — Implementation defect | **FIXED** (Verified) |
| MM-005 | 2026-10-02T01:53:00Z | UX / A11y | Candidate Accessibility | Full keyboard & screen reader accessibility | Visually hidden file input lacked accessible focus/tab index; JD textarea lacked label | MEDIUM | D2 — Implementation defect | **FIXED** (Verified) |
| MM-006 | 2026-10-02T01:53:00Z | Dependencies | Tooling & Types | Wrangler v4 and compatible worker types | Outdated Wrangler 3.114.17 with mismatched workers-types | LOW | D5 — Configuration mismatch | **FIXED** (Wrangler 4.145.0) |
| MM-007 | 2026-10-02T01:53:00Z | Repo Cleanliness | Temporary Scripts | Clean working tree without temporary patch scripts | 15 scratch `.cjs` files committed in `8934acd` and 15 untracked scratch files | LOW | D1 — Documentation / Repo cleanliness | **FIXED** (Reconciled) |
| MM-008 | 2026-10-02T02:48:00Z | Security | Credential Governance | Zero plaintext secrets in chat/logs | Plaintext tokens purged from environment; OAuth authentication established; rotation initiated | CRITICAL | D7 — Security Hard Stop | **CONTAINED (Resolved)** |
