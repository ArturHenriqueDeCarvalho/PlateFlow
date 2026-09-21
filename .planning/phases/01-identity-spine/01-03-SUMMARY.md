---
phase: 01-identity-spine
plan: 03
subsystem: auth
tags: [refresh-rotation, logout-revoke, csrf-origin, silent-refresh, httpOnly-cookies]

requires:
  - phase: 01-identity-spine
    provides: Cookie login + /me + locked plates (01-02); Wave 0 RED inject suite
provides:
  - Opaque refresh rotation until login+8h hard ceiling (D-03)
  - Logout revoke + clear both session cookies (AUTH-01)
  - requireOrigin 403 on foreign Origin mutations (D-04)
  - SPA apiFetch silent refresh once then retry
affects:
  - 01-04
  - 01-05
  - 01-06

actuals:
  tokens: 4583
  tasks: 3
  commits: 3
plan_head_before: 2be63b91f3d124960c8df415df75f5ac6dae116e

tech-stack:
  added: []
  patterns:
    - "Refresh rotates opaque hash; session_expires_at never slides"
    - "requireAuth rejects revoked/expired sid so logout kills access JWT"
    - "CSRF = SameSite Lax + Origin allowlist on POST/PUT/PATCH/DELETE"
    - "SPA apiFetch: credentials include, no Bearer, one refresh retry"

key-files:
  created:
    - apps/plateflow-api/src/core/use-cases/auth/RefreshSessionUseCase.ts
    - apps/plateflow-api/src/core/use-cases/auth/LogoutUseCase.ts
    - apps/plateflow-api/src/infrastructure/http/middleware/requireOrigin.ts
  modified:
    - apps/plateflow-api/src/core/repositories/IRefreshSessionRepository.ts
    - apps/plateflow-api/src/infrastructure/database/DrizzleRefreshSessionRepository.ts
    - apps/plateflow-api/src/infrastructure/auth/sessionCookies.ts
    - apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts
    - apps/plateflow-api/src/infrastructure/http/routes/authRoutes.ts
    - apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts
    - apps/plateflow-api/src/infrastructure/http/app.ts
    - apps/plateflow-app/src/services/storageService.ts

key-decisions:
  - "requireAuth checks refresh_sessions.sid revoked/expired so logout 401s /me with stale access cookie"
  - "D-07 pendingLogout / ZIP-in-flight deferred to plan 06 — failed refresh clears AUTH_USER immediately"

patterns-established:
  - "POST /refresh without requireAuth; POST /logout clears cookies even when access JWT expired"
  - "rotateTokenHash keeps session id and session_expires_at; access exp = min(now+15m, ceiling)"
  - "apiFetch single-flights concurrent refresh via shared promise"

requirements-completed: [AUTH-01]

coverage:
  - id: D1
    description: "POST /api/auth/refresh rotates opaque cookie within 8h; reused prior opaque returns 401"
    requirement: AUTH-01
    verification:
      - kind: integration
        ref: "apps/plateflow-api/src/auth/auth.inject.test.ts#AUTH-01 refresh rotates within 8h"
        status: pass
    human_judgment: false
  - id: D2
    description: "POST /api/auth/logout clears both cookies and revokes refresh so subsequent /me is 401"
    requirement: AUTH-01
    verification:
      - kind: integration
        ref: "apps/plateflow-api/src/auth/auth.inject.test.ts#AUTH-01 logout clears cookies"
        status: pass
    human_judgment: false
  - id: D3
    description: "Mutating requests with foreign Origin return Portuguese 403"
    requirement: AUTH-01
    verification:
      - kind: integration
        ref: "apps/plateflow-api/src/auth/auth.inject.test.ts#AUTH-01 foreign Origin mutation 403"
        status: pass
    human_judgment: false
  - id: D4
    description: "SPA apiFetch silently refreshes once on 401 then retries; no Authorization Bearer"
    requirement: AUTH-01
    verification:
      - kind: other
        ref: "pnpm --filter @plateflow/app lint"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-09-21
status: complete
---

# Phase 1 Plan 03: Session lifetime Summary

**Opaque refresh rotation until the 8h login ceiling, logout revoke, SPA silent renew, and Origin CSRF on mutations**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-21T18:47:55Z
- **Completed:** 2026-09-21T18:53:34Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- `RefreshSessionUseCase` hashes refresh cookie, rejects revoked/expired sessions, rotates opaque value without sliding `session_expires_at`
- `LogoutUseCase` revokes the current refresh row; `clearSessionCookies` clears both HttpOnly cookies; `requireAuth` rejects revoked `sid`
- `requireOrigin` returns Portuguese 403 for foreign Origin on POST/PUT/PATCH/DELETE; GET `/r/:slug` unchanged
- SPA `apiFetch` uses credentials include, strips Authorization, retries once after `POST /api/auth/refresh`

## Task Commits

Each task was committed atomically:

1. **Task 1: Refresh rotate and logout revoke** - `6a235bd` (feat)
2. **Task 2: Origin check on mutating requests** - `8b37f7d` (feat)
3. **Task 3: SPA silent refresh wrapper** - `bddd290` (feat)

**Plan metadata:** `238a2aa` (docs: complete plan)

_Note: RED inject contracts already existed from 01-01; this plan shipped GREEN only._

## Files Created/Modified

- `apps/plateflow-api/src/core/use-cases/auth/RefreshSessionUseCase.ts` - Rotate opaque refresh until 8h ceiling
- `apps/plateflow-api/src/core/use-cases/auth/LogoutUseCase.ts` - Revoke refresh by hash, sid, or user
- `apps/plateflow-api/src/infrastructure/http/middleware/requireOrigin.ts` - Origin allowlist on mutations
- `apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts` - refresh + logout handlers
- `apps/plateflow-api/src/infrastructure/http/routes/authRoutes.ts` - POST /refresh (no requireAuth), POST /logout
- `apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts` - sid revocation gate
- `apps/plateflow-api/src/infrastructure/http/app.ts` - onRequest requireOrigin hook
- `apps/plateflow-app/src/services/storageService.ts` - silent refresh apiFetch + logout POST

## Decisions Made

- `requireAuth` checks `refresh_sessions` by JWT `sid` so logout invalidates access without a JWT denylist
- D-07 `pendingLogout` / ZIP-in-flight stays plan 06 — failed refresh clears `AUTH_USER` immediately

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Sid revocation check in requireAuth**
- **Found during:** Task 1 (logout inject expects /me 401 with stale access cookie)
- **Issue:** Clearing Set-Cookie does not invalidate an already-held access JWT under inject
- **Fix:** After jwtVerify, load refresh session by `sid` and 401 if revoked or past `session_expires_at`
- **Files modified:** `apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts`, repository `findById`
- **Verification:** AUTH-01 logout clears cookies passes
- **Committed in:** `6a235bd` (Task 1)

**2. [Rule 3 - Blocking] Typed Map for getStats redirect lookup**
- **Found during:** Task 3 (`pnpm --filter @plateflow/app lint`)
- **Issue:** Pre-existing `Map` inference made `r.status` unknown; lint gate failed on the file under edit
- **Fix:** `new Map<string, DynamicRedirect>(...)`
- **Files modified:** `apps/plateflow-app/src/services/storageService.ts`
- **Verification:** app lint passes
- **Committed in:** `bddd290` (Task 3)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both required for AUTH-01 logout contract and plan verify; no scope creep into change-password or print-lot.

## Issues Encountered

- Dirty-tree batch slug edits were mixed into `storageService.ts`; reverted those hunks before committing so only silent-refresh landed

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- AUTH-01 session lifetime complete for refresh/logout/CSRF/SPA renew
- Ready for 01-04+ (change-password AUTH-03, remaining inventory locks, print-lot D-07)

## Self-Check: PASSED

- FOUND: RefreshSessionUseCase.ts, LogoutUseCase.ts, requireOrigin.ts
- FOUND: commits 6a235bd, 8b37f7d, bddd290
- FOUND: inject AUTH-01 refresh|logout|foreign Origin pass; app lint pass

---
*Phase: 01-identity-spine*
*Completed: 2026-09-21*
