---
phase: 01-identity-spine
plan: 04
subsystem: auth
tags: [requireAuth, analytics-ip, anly-04, inventory-lock, spa-401]

requires:
  - phase: 01-identity-spine
    provides: Cookie sessions + refresh/logout (01-02/01-03); Wave 0 ANLY-04 inject stubs
provides:
  - requireAuth on GET /api/redirects, /api/templates, /api/analytics
  - AnalyticsLog JSON without ip (mapRow omit; create still writes)
  - SPA fetch* 401 → logout + [] (no localStorage shop dump)
affects:
  - 01-05
  - 01-06

actuals:
  tokens: 1605
  tasks: 3
  commits: 4
plan_head_before: 838b176465e87bf2ce8d17658c5490ba8ec847d7

tech-stack:
  added: []
  patterns:
    - "Inventory list GETs use preHandler requireAuth; public resolve stays open"
    - "mapRow omits ip; create persists ip on analytics column"
    - "fetch* on 401: logout() then []; network errors may still use cache"

key-files:
  created: []
  modified:
    - apps/plateflow-api/src/infrastructure/http/routes/redirectRoutes.ts
    - apps/plateflow-api/src/infrastructure/http/routes/templateRoutes.ts
    - apps/plateflow-api/src/infrastructure/http/routes/analyticsRoutes.ts
    - apps/plateflow-api/src/infrastructure/database/DrizzleAnalyticsRepository.ts
    - apps/plateflow-api/src/auth/auth.inject.test.ts
    - apps/plateflow-app/src/services/storageService.ts

key-decisions:
  - "Strengthen ANLY-04 analytics inject to seed a row with ip so no-ip assert is non-vacuous"
  - "Keep AnalyticsLog.ip optional on the shared type for the write path; never serialize on GET"

patterns-established:
  - "Copy plateRoutes GET { preHandler: [requireAuth] } onto other inventory list routes"
  - "Operator-facing analytics DTO must not include ip even when DB column is populated"

requirements-completed: [ANLY-04]

coverage:
  - id: D1
    description: "Unauthenticated GET /api/templates and /api/redirects return 401; public /r/:slug stays open"
    requirement: ANLY-04
    verification:
      - kind: integration
        ref: "apps/plateflow-api/src/auth/auth.inject.test.ts#ANLY-04 inventory GETs 401"
        status: pass
      - kind: integration
        ref: "apps/plateflow-api/src/auth/auth.inject.test.ts#SCAN safety public /r/:slug"
        status: pass
    human_judgment: false
  - id: D2
    description: "GET /api/analytics requires auth and JSON logs omit ip while create still stores ip"
    requirement: ANLY-04
    verification:
      - kind: integration
        ref: "apps/plateflow-api/src/auth/auth.inject.test.ts#ANLY-04 analytics 401 and no ip"
        status: pass
    human_judgment: false
  - id: D3
    description: "SPA fetchTemplates/fetchRedirects/fetchAnalytics on 401 logout and return empty lists"
    requirement: ANLY-04
    verification:
      - kind: other
        ref: "pnpm --filter @plateflow/app lint"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-09-21
status: complete
---

# Phase 1 Plan 04: Inventory lock & IP strip Summary

**Locked inventory/analytics/template list GETs behind requireAuth, omitted ip from analytics JSON, and stopped SPA 401 from painting localStorage inventory**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-21T18:56:01Z
- **Completed:** 2026-09-21T19:02:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- `requireAuth` on GET `/` for redirects, templates, and analytics; public `/r/:slug` and `/api/redirects/:slug/resolve` unchanged
- `DrizzleAnalyticsRepository.mapRow` no longer copies `ip`; `create()` still writes `ip`
- `fetchTemplates` / `fetchRedirects` / `fetchAnalytics` mirror `fetchPlates`: 401 → `logout()` + `[]`
- Dashboard readings remain Placa / Dispositivo / Data e Horário only (no `log.ip`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Require auth on inventory list GETs** - `474002e` (feat)
2. **Task 2: Strip ip from analytics JSON DTOs** - `2227f3f` (test) + `5115726` (feat)
3. **Task 3: Stop treating GET 401 as localStorage inventory** - `1824f67` (feat)

**Plan metadata:** `41eccfd` (docs: complete plan)

_Note: Wave 0 already named ANLY-04 inventory/analytics injects; Task 2 added a seeded-ip RED so the no-ip assert cannot pass on an empty array._

## Files Created/Modified

- `apps/plateflow-api/src/infrastructure/http/routes/redirectRoutes.ts` - GET `/` requireAuth
- `apps/plateflow-api/src/infrastructure/http/routes/templateRoutes.ts` - GET `/` requireAuth
- `apps/plateflow-api/src/infrastructure/http/routes/analyticsRoutes.ts` - GET `/` requireAuth + import
- `apps/plateflow-api/src/infrastructure/database/DrizzleAnalyticsRepository.ts` - mapRow omits ip
- `apps/plateflow-api/src/auth/auth.inject.test.ts` - seed analytics row before no-ip assert
- `apps/plateflow-app/src/services/storageService.ts` - 401 → logout + [] on three fetchers

## Decisions Made

- Strengthen ANLY-04 analytics inject with a seeded `ip` row so the contract fails until mapRow omits it
- Leave optional `AnalyticsLog.ip` on `@plateflow/types` for the write path; do not serialize on GET

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Vacuous no-ip assert on empty analytics**
- **Found during:** Task 2 (ANLY-04 analytics 401 and no ip)
- **Issue:** Empty GET body passed `assertNoIpKey` without proving mapRow strips ip
- **Fix:** Seed a log with `ip: 203.0.113.50` via `DrizzleAnalyticsRepository.create`, then assert GET JSON has no ip key
- **Files modified:** `apps/plateflow-api/src/auth/auth.inject.test.ts`
- **Verification:** Test failed RED on `$[0] must not include an ip key`, then GREEN after mapRow omit
- **Committed in:** `2227f3f` (test) / `5115726` (feat)

---

**Total deviations:** 1 auto-fixed (Rule 2)
**Impact on plan:** Required for ANLY-04 / T-1-12 correctness; no scope creep into public resolve or UI redesign.

## Issues Encountered

- Default node:test fancy reporter broke `gsd_run check tdd-red-evidence` TAP parsing (`zero_tests_discovered`); RED was confirmed by AssertionError on ip before GREEN. Prefer `--test-reporter=tap` for evidence when needed.
- Dirty-tree plates.slug / batch mint files left uncommitted per orchestrator warning.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ANLY-04 inventory lock + IP strip done; public scan path intact
- Ready for 01-05 (custody / owner scoping) and 01-06 (print console / logout UX)

## TDD Gate Compliance

| Task | RED commit | GREEN commit | Notes |
|------|------------|--------------|-------|
| 1 inventory GETs | Wave 0 `01-01` inject | `474002e` | Existing RED; GREEN only |
| 2 analytics no ip | `2227f3f` | `5115726` | Seeded-ip RED → mapRow omit |
| 3 SPA 401 cache | n/a (lint verify) | `1824f67` | Frontend glue; app lint verify |

## Self-Check: PASSED

---
*Phase: 01-identity-spine*
*Completed: 2026-09-21*
