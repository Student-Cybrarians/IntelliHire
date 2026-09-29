# IntelliHire Architecture Rules

## 1. Locked Routing / Authentication Baseline
- **Component**: \src/client/components/ProtectedRoute.tsx\
- **Baseline Commit**: \90280b95dca87d25671bcedb679d2eb61e348161\
- **Rule**: DO NOT modify, refactor, replace, or redesign this authentication/redirect implementation unless a new authentication defect is demonstrated AND explicitly authorized by the user.
- **Constraints**:
  - Do NOT change \ProtectedRoute.tsx\ merely as part of UI redesign.
  - Do NOT replace the redirect logic with another routing mechanism.
  - Do NOT add arbitrary timeouts/delays to mask redirect problems.
  - Do NOT change \/dashboard\ ? \/login\ behavior without proving an authentication failure.
  - Preserve explicit \same-origin\ credentials, \eplace: true\ history states, and \onboarding_completed\ normalization (\	rue\ or \1\).
  - Prior to any authorized changes affecting navigation: verify the OAuth loop, verify dashboard refreshes, and verify unauthenticated routing.

