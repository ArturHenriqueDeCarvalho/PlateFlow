---
phase: 01-identity-spine
plan: 02
subsystem: auth
tags: [fastify-jwt, httpOnly-cookies, scrypt, drizzle-migrate, cors-allowlist]

requires:
  - phase: 01-identity-spine
    provides: Wave 0 RED inject suite (auth.inject.test.ts) and API node:test runner
provides:
  - Cookie-only JWT session (plateflow_access / plateflow_refresh)
  - users + refresh_sessions tables with drizzle migrate
  - LoginUseCase + ScryptPasswordHasher + requireAuth onlyCookie
  - GET /api/plates locked; public /r/:slug anonymous; APP_ORIGIN CORS
affects:
  - 01-03
  - 01-04
  - 01-05
  - 01-06

actuals:
  tokens: 13291
  tasks: 3
  commits: 1
plan_head_before: d31be9edae8e86461410900c2d888501674c5d99

tech-stack:
  added:
    - "@fastify/jwt@^10.2.2"
    - "@fastify/cookie@^11.1.2"
  patterns:
    - "HttpOnly cookie pair; login JSON { user } only; credentials include on SPA fetch"
    - "requireAuth via jwtVerify({ onlyCookie: true }); never onRequest jwtVerify"
    - "APP_ORIGIN allowlist CORS with credentials true"
    - "drizzle migrate({ migrationsFolder }) then seedDefaultTemplates; no db:push"

key-files:
  created:
    - packages/database/drizzle/0000_add-identity-tables.sql
    - apps/plateflow-api/src/core/use-cases/auth/LoginUseCase.ts
    - apps/plateflow-api/src/infrastructure/crypto/ScryptPasswordHasher.ts
    - apps/plateflow-api/src/infrastructure/auth/sessionCookies.ts
    - apps/plateflow-api/src/infrastructure/auth/seedAdminUser.ts
    - apps/plateflow-api/src/infrastructure/auth/FastifyTokenIssuer.ts
    - apps/plateflow-api/src/infrastructure/database/DrizzleUserRepository.ts
    - apps/plateflow-api/src/infrastructure/database/DrizzleRefreshSessionRepository.ts
  modified:
    - apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts
    - apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts
    - apps/plateflow-api/src/infrastructure/http/app.ts
    - apps/plateflow-api/src/infrastructure/http/routes/plateRoutes.ts
    - apps/plateflow-app/src/services/storageService.ts
    - apps/plateflow-app/src/components/LoginScreen.tsx
    - apps/plateflow-app/src/App.tsx
    - packages/database/src/migrate.ts
    - packages/database/src/schema/index.ts
    - turbo.json
    - .env.example

key-decisions:
  - "Delete prefix Bearer auth in the same change as cookie sessions (T-1-01)"
  - "Task 2/3 needed no extra commits — migrate already applied; inject greens from Task 1"
  - "Leave AUTH-03, remaining ANLY-04 GETs, SHOP-01 batch, foreign-Origin 403 RED until later plans"

patterns-established:
  - "Inject helpers cookieJarFrom(loginRes) pass Set-Cookie into subsequent inject cookies"
  - "seedAdminUser onConflictDoNothing on email; never overwrite password_hash"
  - "Production fail-closed when JWT_SECRET <32 bytes or ADMIN_* missing"

requirements-completed: [AUTH-01, SHOP-01]

coverage:
  - id: D1
    description: "Admin cookie login returns { user } only with HttpOnly plateflow_access and plateflow_refresh; GET /api/auth/me succeeds with those cookies"
    requirement: AUTH-01
    verification:
      - kind: integration
        ref: "apps/plateflow-api/src/auth/auth.inject.test.ts#AUTH-01 login sets cookies and /me"
        status: pass
    human_judgment: false
  - id: D2
    description: "GET /api/plates rejects forged Bearer and missing cookie with 401"
    requirement: AUTH-01
    verification:
      - kind: integration
        ref: "apps/plateflow-api/src/auth/auth.inject.test.ts#AUTH-01 forged bearer 401 on GET plates"
        status: pass
      - kind: integration
        ref: "apps/plateflow-api/src/auth/auth.inject.test.ts#AUTH-01 missing cookie 401 on GET plates"
        status: pass
    human_judgment: false
  - id: D3
    description: "Public GET /r/:slug is not 401 and does not return login JSON"
    requirement: AUTH-01
    verification:
      - kind: integration
        ref: "apps/plateflow-api/src/auth/auth.inject.test.ts#SCAN safety public /r/:slug"
        status: pass
    human_judgment: false
  - id: D4
    description: "CORS does not reflect foreign Origin (evil.example) on OPTIONS preflight"
    requirement: AUTH-01
    verification:
      - kind: integration
        ref: "apps/plateflow-api/src/auth/auth.inject.test.ts#CORS foreign origin"
        status: pass
    human_judgment: false
  - id: D5
    description: "LoginScreen Entrar on unified host signs in; console after /me; logged-out tab shows no Header"
    requirement: AUTH-01
    verification: []
    human_judgment: true
    rationale: "Visual SPA session gate requires human judgment on the unified host (plan human-check); deferred to end-of-phase UAT"

duration: 2min
completed: 2026-09-21
status: complete
---

# Phase 1 Plan 02: Walking-skeleton cookie login Summary

**HttpOnly cookie JWT walking skeleton: seeded admin login, /me, locked GET /api/plates, public /r/:slug, APP_ORIGIN CORS — proven by five green inject cases**

## Performance

- **Duration:** 2 min (continuation after Task 1 checkpoint)
- **Started:** 2026-09-21T18:43:35Z
- **Completed:** 2026-09-21T18:44:56Z
- **Tasks:** 3
- **Files modified:** 30 (Task 1 commit); Tasks 2–3 verification-only

## Accomplishments
- Cookie-only session path: LoginUseCase + scrypt hasher + `requireAuth` `onlyCookie`, SPA `credentials: 'include'`, zinc LoginScreen retained
- Identity SQL (`users`, `refresh_sessions`) applied via drizzle migrate without recreating shop tables
- Walking-skeleton inject subset green: AUTH-01 login/forged/missing cookie, SCAN safety, CORS foreign

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end cookie login, /me, and GET /api/plates** - `780120b` (feat)
2. **Task 2: Apply identity SQL migration** - verified only (migrate exit 0; already applied; no code commit)
3. **Task 3: Green walking-skeleton inject cases** - verified only (5/5 pass against Task 1 implementation; no test file edits required)

**Plan metadata:** (this commit)

## Files Created/Modified
- `packages/database/drizzle/0000_add-identity-tables.sql` - CREATE users + refresh_sessions only
- `packages/database/src/migrate.ts` - drizzle-orm node-postgres migrator then seedDefaultTemplates
- `apps/plateflow-api/src/core/use-cases/auth/LoginUseCase.ts` - email/password verify + refresh row
- `apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts` - jwtVerify onlyCookie
- `apps/plateflow-app/src/services/storageService.ts` - credentials include; Bearer/localStorage token removed
- `apps/plateflow-api/src/auth/auth.inject.test.ts` - cookie jar helpers (from Wave 0; greens from Task 1)

## Decisions Made
- Prefix Bearer deleted in the same change as cookies (threat T-1-01)
- Tasks 2–3 produced no additional commits: human confirmed migrate applied; inject greens needed no helper tweaks
- Deferred RED cases (refresh, logout, AUTH-03, ANLY-04 inventory GETs, SHOP-01 batch, foreign-Origin 403) left failing until later plans

## Deviations from Plan

None - plan executed exactly as written (Task 2/3 were verify-and-proceed after human checkpoint).

## Issues Encountered
- Plan paused at Task 2 human-action for DATABASE_URL / migrate; resumed after operator verified env + tables exist

## Auth Gates
- Task 2 human-action: operator confirmed DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, APP_ORIGIN in repo-root `.env` and identity migrate applied — then resume verified `pnpm --filter @plateflow/database migrate` exit 0

## User Setup Required
None beyond the plan `user_setup` already satisfied (Postgres + JWT_SECRET + ADMIN_* + APP_ORIGIN in `.env`). Do not commit `.env`.

## Next Phase Readiness
- AUTH-01 walking skeleton proven via inject; ready for plan 03+ (refresh rotation, logout, password change, remaining GET locks)
- Human LoginScreen UAT deferred to end-of-phase (`workflow.human_verify_mode=end-of-phase`)
- Out-of-scope dirty tree (plates.slug UNIQUE / batch minting) left uncommitted — not part of 01-02

## Self-Check: PASSED

- FOUND: `.planning/phases/01-identity-spine/01-02-SUMMARY.md`
- FOUND: commit `780120b`
- FOUND: migrate exit 0; inject pattern 5 pass / 0 fail

---
*Phase: 01-identity-spine*
*Completed: 2026-09-21*
