# Test Evidence & Verification Audit

Executable test evidence supporting Module 1 verification.

## 1. Test Suite Results (`vitest run`)

- **Command**: `npm test`
- **Duration**: ~19.7s
- **Test Files**: 16 passed (16 total)
- **Individual Tests**: 40 passed (40 total)

### Detailed Breakdown:
- `functions/api/resume.test.ts`: 9 passed (Resume upload, MIME validation, size limits, context package)
- `functions/api/dashboard.test.ts`: 5 passed (Role isolation, stats)
- `functions/api/requisition.test.ts`: 4 passed (Job parsing, creation)
- `functions/api/competency.test.ts`: 2 passed (Competency model mapping)
- `functions/api/m1.test.ts`: 2 passed (ATS score determinism, JD requirements)
- `functions/api/pipeline.test.ts`: 2 passed (Status transitions)
- `functions/api/profile.test.ts`: 2 passed (Profile CRUD, taxonomy IDs)
- `functions/api/search.test.ts`: 2 passed (Domain & occupation searches)
- `tests/security.test.ts`: 2 passed (Candidate cross-tenant isolation, unauthorized blocking)
- `src/client/pages/Dashboard.test.tsx`: 3 passed (Candidate workspace rendering, role boundaries)
- `src/client/pages/Onboarding.test.tsx`: 2 passed (Step navigation, taxonomy fetch)
- `tests/a11y.test.ts`: 1 passed (Accessible input, ARIA attributes)
- `tests/ai.test.ts`: 1 passed (AI schema compliance, array boundaries)
- `tests/e2e.test.ts`: 1 passed (E2E API route orchestration)
- `functions/api/analytics.test.ts`: 1 passed (Summary metrics)
- `functions/api/assessment.test.ts`: 1 passed (Quarantined schema baseline)

## 2. E2E Browser & Runtime Validation
- **Local Runtime Validation**:
  - `GET /` -> HTTP 200
  - `GET /login` -> HTTP 200
  - `GET /api/candidate/context` -> HTTP 401 (proves API routing is not intercepted by SPA)
- **Browser Automation Report**: Captured in `m1-browser-e2e-report.md`.
