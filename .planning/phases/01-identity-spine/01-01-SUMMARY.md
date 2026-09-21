---
phase: 01-identity-spine
plan: 01
subsystem: testing
tags: [node-test, fastify-inject, auth, nyquist]

requires: []
provides:
  - Fastify inject contract suite for AUTH-01, AUTH-03, ANLY-04, SHOP-01
  - "@plateflow/api test script using node --import tsx --test"
affects:
  - 01-02
  - 01-03
  - 01-04
  - 01-05
  - 01-06

actuals:
  tokens: 2728
  tasks: 2
  commits: 2
plan_head_before: f9a5c55fe48ed7f8a43691def76c52dcbcbd82ec

tech-stack:
  added: []
  patterns:
    - "Wave 0 Nyquist net: node:test + Fastify inject, no Jest/Vitest"
    - "API ESM tests import production modules with .js specifiers"

key-files:
  created:
    - apps/plateflow-api/src/auth/auth.inject.test.ts
  modified:
    - apps/plateflow-api/package.json

key-decisions:
  - "Keep node:test + tsx as the API runner; do not add Jest or Vitest"
  - "Import createFastifyApp via .js specifier so tsc --noEmit passes"
  - "Wave 0 is RED-only; GREEN belongs to later identity-spine plans"

patterns-established:
  - "Inject suite builds createFastifyApp, sets NODE_ENV=test, closes the app in after()"
  - "Contract titles are stable --test-name-pattern targets for later plans"

requirements-completed: [AUTH-01, AUTH-03, ANLY-04, SHOP-01]

coverage:
  - id: D1
    description: "@plateflow/api test script runs node --import tsx --test without Jest or Vitest"
    requirement: AUTH-01
    verification:
      - kind: other
        ref: "node -e package.json scripts.test includes node --import tsx --test"
        status: pass
    human_judgment: false
  - id: D2
    description: "auth.inject.test.ts names AUTH-01/03, ANLY-04, SHOP-01, SCAN, CORS, and foreign-Origin 403 contracts and enumerates 12 inject cases"
    requirement: AUTH-01
    verification:
      - kind: unit
        ref: "apps/plateflow-api/src/auth/auth.inject.test.ts#AUTH-01 login sets cookies and /me"
        status: pass
      - kind: other
        ref: "pnpm --filter @plateflow/api exec node --import tsx --test src/auth/auth.inject.test.ts (12 tests enumerated, 11 fail on unimplemented contracts, SCAN safety passes)"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-09-21
status: complete
---

# Phase 1 Plan 01: Wave 0 inject suite Summary

**node:test + Fastify inject Nyquist net naming AUTH-01, AUTH-03, ANLY-04, and SHOP-01 cookie-session contracts before production auth changes**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-21T17:34:14Z
- **Completed:** 2026-09-21T17:41:02Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `@plateflow/api` now has `"test": "node --import tsx --test src/**/*.test.ts"` with tsx already in devDependencies
- `auth.inject.test.ts` injects `createFastifyApp` with NODE_ENV=test fixtures (JWT_SECRET ≥32 bytes, ADMIN_EMAIL/PASSWORD, APP_ORIGIN)
- Twelve named cases cover login cookies `/me`, forged Bearer, missing cookie, refresh rotation, logout, change-password, analytics IP strip, inventory GET locks, batch persist gate, public `/r/:slug`, CORS non-reflection, and foreign-Origin mutation 403

## Task Commits

Each task was committed atomically:

1. **Task 1: Add API node:test script** - `272e986` (chore)
2. **Task 2: Write failing identity inject suite** - `dfd6372` (test)

**Plan metadata:** (this commit)

_Note: TDD tasks may have multiple commits (test → feat → refactor)_

## Files Created/Modified
- `apps/plateflow-api/package.json` - Added `test` script using node --import tsx --test
- `apps/plateflow-api/src/auth/auth.inject.test.ts` - Wave 0 Fastify inject contracts

## Decisions Made
- Did not add Jest or Vitest; the API runner is Node's built-in test runner plus existing tsx
- Imported `createFastifyApp` from `../infrastructure/http/app.js` so `tsc --noEmit` matches the rest of the API ESM specifiers
- Left unimplemented cookie-session assertions red; SCAN safety already passes because public `/r/:slug` is not a login JSON 401

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESM import uses `.js` instead of `.ts`**
- **Found during:** Task 2 (lint after inject suite)
- **Issue:** Plan asked to import `../infrastructure/http/app.ts`; `tsc --noEmit` fails TS5097 unless `allowImportingTsExtensions` is on
- **Fix:** Import `../infrastructure/http/app.js`, the same specifier `server.ts` already uses. tsx still loads the TypeScript source
- **Files modified:** `apps/plateflow-api/src/auth/auth.inject.test.ts`
- **Verification:** `pnpm --filter @plateflow/api lint` exits 0; inject suite still enumerates 12 tests
- **Committed in:** `dfd6372` (Task 2 commit)

**2. [Rule 3 - Blocking] Installed workspace lockfile dependencies**
- **Found during:** Task 2 (first test run)
- **Issue:** `tsx` was declared on `@plateflow/api` but `node_modules` was missing, so `--import tsx` could not start
- **Fix:** `pnpm install --frozen-lockfile` (no new packages, no Fastify bump)
- **Files modified:** none committed (`node_modules` is gitignored)
- **Verification:** inject suite starts and reports 12 tests
- **Committed in:** n/a (install only)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both required to run the Wave 0 net. No Jest/Vitest, no production auth implementation.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED | `dfd6372` `test(01-01): add failing identity inject suite` | Pass — `tdd-red-evidence` verdict `RED_EVIDENCE_OK` (`target_test_failed` on `AUTH-01 login sets cookies and /me`; 12 tests, 11 fail, SCAN safety passes) |
| GREEN | — | Deferred by design. This plan is Wave 0 Nyquist sampling only; later plans green subsets via `--test-name-pattern` |
| REFACTOR | — | Not needed |

Plan frontmatter is `type: execute` with `tdd="true"` tasks. Task 1 is config-only (test script). Task 2 is test-only RED. No `feat(01-01)` commit on purpose.

## Issues Encountered
- Git Bash PATH lacked `pnpm` until `corepack enable`; used corepack pnpm 11.9.0 matching `packageManager`
- Unauthenticated inventory/analytics GETs currently hit Postgres and return 500 when the query fails; the contracts still fail correctly on `401` assertions
- SCAN safety is already green (public `/r/:slug` is not login JSON) — regression net, not an unexpected feature

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Ready for `01-02-PLAN.md` (walking skeleton / cookie JWT). Run subsets with `--test-name-pattern` as those contracts go green
- Do not treat AUTH-01/03, ANLY-04, or SHOP-01 as product-complete; this plan only named the checks

## Self-Check: PASSED

- FOUND: `apps/plateflow-api/package.json`
- FOUND: `apps/plateflow-api/src/auth/auth.inject.test.ts`
- FOUND: commit `272e986`
- FOUND: commit `dfd6372`
- Verify: suite starts, 12 tests enumerated, no `Cannot find module`

---
*Phase: 01-identity-spine*
*Completed: 2026-09-21*
