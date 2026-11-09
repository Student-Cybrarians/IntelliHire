# DEPLOYMENT GUIDE: INTELLIHIRE V3

**Date:** November 9, 2026  
**Target Environment:** Cloudflare Pages (`https://intellihire-v3.pages.dev`)  
**Database:** Cloudflare D1 (`intellihire-db`)  
**Storage:** Cloudflare KV (`SESSION_KV`, `RESUME_KV`)  
**Branch:** `main`

---

## 1. Prerequisites

1. **Node.js:** Ensure Node.js $\ge 20$ (current verified environment: Node.js 22.23.2).
2. **Cloudflare Wrangler CLI:** Installed in `devDependencies` or run via `npx wrangler`.
3. **Cloudflare Account & Credentials:** Signed in via `npx wrangler login` or configured via `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`.

---

## 2. Environment Variables & Bindings Configuration

The application requires the following bindings configured in Cloudflare Pages project settings (`Settings -> Functions -> Variables and Secrets`):

| Variable / Binding | Type | Purpose | Production Value / Note |
|---|---|---|---|
| `DB` | D1 Database | Main relational database | Connected to D1 database `intellihire-db` |
| `SESSION_KV` | KV Namespace | High-throughput session storage | Bound to `SESSION_KV` namespace |
| `RESUME_KV` | KV Namespace | Caching for extracted resumes and embeddings | Bound to `RESUME_KV` namespace |
| `JWT_SECRET` | Secret | Cryptographic signing for session tokens | Strong random 256-bit secret string |
| `ENVIRONMENT` | Text | Runtime environment flag | `production` |
| `NVIDIA_API_KEY` | Secret | NVIDIA AI inference access | Verified API key (`nvapi-...`) |
| `NVIDIA_MODEL` | Text | Model selection | `meta/muse-glimmer-30b` |
| `GOOGLE_CLIENT_ID` | Secret | OAuth 2.0 client ID | Google Cloud Console OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Secret | OAuth 2.0 client secret | Google Cloud Console OAuth Client Secret |

---

## 3. Database Schema Verification

To apply any pending schema migrations to Cloudflare D1:

```powershell
# List existing D1 databases to verify connectivity
npx wrangler d1 list

# Execute schema migration against the remote production database
npx wrangler d1 execute intellihire-db --file=./schema.sql --remote
```

---

## 4. Build and Pre-Deployment Verification

Always run local preflight and full test verification before deploying:

```powershell
# 1. Run full test suite across all 72 test suites
npm test

# 2. Run TypeScript check and Vite production bundle build
npm run build
```

---

## 5. Direct Deployment via Cloudflare Pages CLI

Deploy the optimized `dist` bundle directly to Cloudflare Pages:

```powershell
# Deploy the build artifact to intellihire-v3 on main branch
npx wrangler pages deploy dist --project-name intellihire-v3 --branch main
```

Upon command completion, Wrangler will output the unique deployment URL and update the canonical production alias:
- **Production Alias:** `https://intellihire-v3.pages.dev`

---

## 6. Git-Integrated Continuous Deployment (CI/CD)

To trigger automated deployment via connected GitHub repository:

```powershell
git add .
git commit -m "feat(ieee): implement complete paper mathematical models across M01-M05 and CRI"
git push origin main
```

Cloudflare Pages automatically detects changes pushed to `main`, runs `npm run build`, and deploys the new release within 60 seconds.

---

## 7. Post-Deployment Verification Checklist

1. Open `https://intellihire-v3.pages.dev/health` and verify HTTP 200 `{ status: "ok" }`.
2. Navigate to `https://intellihire-v3.pages.dev/resume` and test M01 ATS resume upload, TF-IDF cosine matching, and 6-component scoring.
3. Navigate to `https://intellihire-v3.pages.dev/assessment` and verify M02 3PL-IRT adaptive test convergence.
4. Navigate to `https://intellihire-v3.pages.dev/simulation` and test M03 code execution and verbal explanation capture.
5. Navigate to `https://intellihire-v3.pages.dev/interviews` and test M04 STAR interview turns, VADER sentiment, and M05 camera eye/posture tracking.
6. Open `https://intellihire-v3.pages.dev/analytics` and verify 360-degree Candidate Readiness Index (CRI) calculation and radar breakdown.
