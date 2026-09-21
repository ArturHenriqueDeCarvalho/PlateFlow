---
phase: 01-identity-spine
plan: 06
subsystem: auth
tags: [SHOP-01, print-lot, cookie-persist, D-07, pendingLogout, batchInFlight, apiFetch]

requires:
  - phase: 01-identity-spine
    provides: Cookie sessions + requireAuth on POST /api/plates/batch (01-02–01-05)
provides:
  - StorageService.persistBatch via apiFetch (credentials include, silent refresh)
  - App batchInFlight / pendingLogout so ZIP finishes before LoginScreen (D-07)
  - SHOP-01 inject cookie gate green with plates/redirects qty-1 fixture
affects:
  - verify-work UAT for Novo Lote / D-07
  - phase 1 complete

actuals:
  tokens: 2811
  tasks: 2
  commits: 3
plan_head_before: b15557fd6f70df90453580ae0cb327373477aa54

tech-stack:
  added: []
  patterns:
    - "Single persistBatch path for App handleBatchCreated and StorageService.generateBatch"
    - "D-07: batchInFlight defers clearAuthUserCache / logout until onProcessingChange false"
    - "pendingLogout → setUser(null) with no sessão expirada interstitial"

key-files:
  created: []
  modified:
    - apps/plateflow-api/src/auth/auth.inject.test.ts
    - apps/plateflow-app/src/App.tsx
    - apps/plateflow-app/src/services/storageService.ts
    - apps/plateflow-app/src/components/BatchGeneratorModal.tsx

key-decisions:
  - "SHOP-01 inject fixture uses client plates/redirects qty 1 (not bare quantity) — CreateBatch validation requires a real body; assert 2xx because controller returns 201"
  - "Wave-0 {quantity:1} was INVALID_RED (400); cookie requireAuth was already green after fixture fix — frontend persistBatch still required for App"
  - "Leave plates.slug UNIQUE / entropy slug hotfix uncommitted — separate from 01-06"

patterns-established:
  - "Print-lot persist only through StorageService.persistBatch → apiFetch"
  - "StorageService.setBatchInFlight + setOnPendingLogout bridge modal processing to session clear"

requirements-completed: [SHOP-01]

coverage:
  - id: D1
    description: "POST /api/plates/batch 401 without cookies; 2xx with login cookies for qty-1 plates/redirects fixture (SHOP-01)"
    requirement: SHOP-01
    verification:
      - kind: integration
        ref: "apps/plateflow-api/src/auth/auth.inject.test.ts#SHOP-01 batch persist cookie gate"
        status: pass
    human_judgment: false
  - id: D2
    description: "App handleBatchCreated uses StorageService.persistBatch (apiFetch credentials); no localStorage token / Authorization Bearer"
    requirement: SHOP-01
    verification:
      - kind: other
        ref: "pnpm --filter @plateflow/app lint"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-07: batchInFlight/pendingLogout keep BatchGeneratorModal mounted until isProcessing false; LoginScreen only after ZIP ready, no sessão expirada copy"
    requirement: SHOP-01
    verification:
      - kind: other
        ref: "pnpm --filter @plateflow/app lint"
        status: pass
    human_judgment: true
    rationale: "In-flight ZIP vs expired access cookie needs a logged-in visual pass (Novo Lote progress bar then LoginScreen)"

duration: 6min
completed: 2026-09-21
status: complete
---

# Phase 1 Plan 06: Print-lot cookie persist + D-07 Summary

**SHOP-01 print-lot persist uses cookie apiFetch; D-07 pendingLogout waits until ZIP/canvas finishes before LoginScreen**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-21T19:13:01Z
- **Completed:** 2026-09-21T19:19:33Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Strengthened SHOP-01 inject with plates/redirects qty-1 fixture; cookie gate passes (401 / 2xx)
- `StorageService.persistBatch` + App `handleBatchCreated` — one cookie path, silent refresh once
- `batchInFlight` / `pendingLogout` + `onProcessingChange` so failed refresh cannot unmount the modal mid-progress (D-07)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED/fixture: SHOP-01 inject** - `02637f8` (test)
2. **Task 1 GREEN: persistBatch** - `59549cb` (feat)
3. **Task 2: D-07 pendingLogout** - `9436acd` (feat)

**Plan metadata:** (pending docs commit)

_Note: Inject was unexpected-green after fixture fix (API requireAuth already present); frontend persist still landed as GREEN feat._

## TDD Gate Compliance

| Gate | Commit | Evidence |
|------|--------|----------|
| RED | `02637f8` | Wave-0 `{quantity:1}` was INVALID_RED (400≠200). Fixture fix → target test green (`UNEXPECTED_GREEN_AFTER_FIXTURE_FIX`). Documented in `.planning/tdd/01-06-task1-red.json`. `TDD_MODE` off — proceeded after investigation. |
| GREEN | `59549cb` | SHOP-01 inject pass; App uses persistBatch |
| REFACTOR | n/a | No cleanup commit required |

## Files Created/Modified

- `apps/plateflow-api/src/auth/auth.inject.test.ts` - SHOP-01 fixture + 2xx assert
- `apps/plateflow-app/src/services/storageService.ts` - persistBatch; batchInFlight session deferral
- `apps/plateflow-app/src/App.tsx` - persistBatch wire; batchInFlight / pendingLogout
- `apps/plateflow-app/src/components/BatchGeneratorModal.tsx` - onProcessingChange only (no canvas restyle)

## Decisions Made

- Fixture qty-1 as plates/redirects body (matches App compose path); assert 2xx not literal 200
- Defer AUTH_USER clear when `batchInFlight`; apply `setUser(null)` only after `isProcessing` false
- Did not bundle database UNIQUE / slug-entropy hotfix into this plan

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] SHOP-01 inject fixture was validation-invalid**
- **Found during:** Task 1
- **Issue:** Wave-0 payload `{ quantity: 1 }` returned 400 (missing templateId/batchIdentifier), masking the cookie gate
- **Fix:** Use plates/redirects qty-1 fixture; assert 2xx (controller returns 201)
- **Files modified:** `apps/plateflow-api/src/auth/auth.inject.test.ts`
- **Commit:** `02637f8`

## Auth Gates

None.

## Known Stubs

None — persistBatch and D-07 gates are wired end-to-end (human UAT still needed for mid-ZIP expiry).

## Threat Flags

None beyond plan threat model (T-1-17 credentials-only persist; T-1-18 pendingLogout).

## Self-Check: PASSED

- SUMMARY, App, storageService, BatchGeneratorModal, auth.inject.test present
- Commits 02637f8, 59549cb, 9436acd present
