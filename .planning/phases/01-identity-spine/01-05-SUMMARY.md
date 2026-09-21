---
phase: 01-identity-spine
plan: 05
subsystem: auth
tags: [change-password, AUTH-03, header-menu, revokeAllForUser, session-cookies]

requires:
  - phase: 01-identity-spine
    provides: Cookie sessions + requireAuth inventory (01-02–01-04)
provides:
  - ChangePasswordUseCase with revokeAllForUser + new cookie pair (D-06)
  - POST /api/auth/change-password behind requireAuth
  - Header account disclosure + Alterar senha Modal (D-05)
  - Awaited StorageService.logout POST /api/auth/logout
affects:
  - 01-06
  - verify-work UAT for Header password flow

actuals:
  tokens: 5191
  tasks: 3
  commits: 4
plan_head_before: 02f3e0109e1ea89e605fcbdebc43119ed61f3331

tech-stack:
  added: []
  patterns:
    - "Own-password change: verify current hash → updatePasswordHash → revokeAllForUser → issue new access+refresh cookies"
    - "Header account chip is a disclosure (aria-haspopup), not a settings route"
    - "Password modal mirrors LoginScreen rose banner + Input field errors"

key-files:
  created:
    - apps/plateflow-api/src/core/use-cases/auth/ChangePasswordUseCase.ts
  modified:
    - apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts
    - apps/plateflow-api/src/infrastructure/http/routes/authRoutes.ts
    - apps/plateflow-api/src/auth/auth.inject.test.ts
    - apps/plateflow-app/src/components/Header.tsx
    - apps/plateflow-app/src/App.tsx
    - apps/plateflow-app/src/services/storageService.ts

key-decisions:
  - "Change-password success keeps the operator in the console via a fresh cookie pair (D-06), never forces LoginScreen"
  - "AUTH-03 inject restores the seed admin password after assertions so later suite tests stay green"
  - "No settings route; Alterar senha lives only in the Header account menu (D-05)"

patterns-established:
  - "Authenticated mutators that invalidate refresh rows must setSessionCookies on the same 200"
  - "Account menu: absolute panel on the user chip; Lock/LogOut lucide icons; Portuguese UI-SPEC copy"

requirements-completed: [AUTH-03]

coverage:
  - id: D1
    description: "Authenticated change-password verifies current password, revokes old refresh, issues new cookies; wrong current returns Senha atual incorreta."
    requirement: AUTH-03
    verification:
      - kind: integration
        ref: "apps/plateflow-api/src/auth/auth.inject.test.ts#AUTH-03 change password then login"
        status: pass
    human_judgment: false
  - id: D2
    description: "Header account menu opens Alterar senha Modal (sm) with Portuguese zinc chrome; success toast Senha alterada.; operator stays in console"
    requirement: AUTH-03
    verification:
      - kind: other
        ref: "pnpm --filter @plateflow/app lint"
        status: pass
    human_judgment: true
    rationale: "UI-SPEC copy, menu disclosure, and toast/console stay-signed-in need a logged-in visual pass"
  - id: D3
    description: "Sair awaits POST /api/auth/logout then clears AUTH_USER / setUser(null)"
    requirement: AUTH-03
    verification:
      - kind: other
        ref: "node assert StorageService.logout POSTs /api/auth/logout and App calls StorageService.logout"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-09-21
status: complete
---

# Phase 1 Plan 05: Change password + account menu Summary

**Own-password change via Header menu: ChangePasswordUseCase revokes refresh rows and issues a new cookie pair; Portuguese zinc Modal matches LoginScreen error chrome**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-21T19:04:15Z
- **Completed:** 2026-09-21T19:10:50Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- `ChangePasswordUseCase` verifies current hash, writes new hash, `revokeAllForUser`, creates a new refresh session
- `POST /api/auth/change-password` behind `requireAuth` with Fastify JSON Schema; 200 sets new HttpOnly cookie pair
- Header disclosure menu (Alterar senha / Sair) + Modal `size="sm"`; toast `Senha alterada.`; awaited logout revoke

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: AUTH-03 inject** - `6dbe261` (test)
2. **Task 1 GREEN: ChangePasswordUseCase + route** - `1360b0b` (feat)
3. **Task 2: Header account menu + password modal** - `2de3364` (feat)
4. **Task 3: Await logout POST** - `9bcb63b` (feat)

**Plan metadata:** (pending docs commit)

_Note: TDD Task 1 produced RED then GREEN commits; no REFACTOR needed._

## TDD Gate Compliance

| Gate | Commit | Evidence |
|------|--------|----------|
| RED | `6dbe261` | `.planning/tdd/01-05-task1-red.json` — `RED_EVIDENCE_OK` (404 on change-password) |
| GREEN | `1360b0b` | AUTH-03 inject pass |
| REFACTOR | n/a | No cleanup commit required |

## Files Created/Modified

- `apps/plateflow-api/src/core/use-cases/auth/ChangePasswordUseCase.ts` - Own-password change + session reissue
- `apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts` - changePassword handler + cookies
- `apps/plateflow-api/src/infrastructure/http/routes/authRoutes.ts` - POST /change-password + schema
- `apps/plateflow-api/src/auth/auth.inject.test.ts` - AUTH-03 inject (wrong current, cookies, restore seed)
- `apps/plateflow-app/src/components/Header.tsx` - Account menu + Alterar senha Modal
- `apps/plateflow-app/src/App.tsx` - Toast Senha alterada.; await logout / session expired
- `apps/plateflow-app/src/services/storageService.ts` - changePassword + awaited logout

## Decisions Made

- Stay signed in after password change via new cookie pair (D-06); 401 on change-password sends operator to LoginScreen without toast
- Restore seed admin password at end of AUTH-03 inject so ANLY-04/SHOP-01 suite logins keep working
- No admin reset of other users; no Esqueci a senha; no settings route

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- RED evidence initially `INVALID_RED` until TAP reporter output was persisted (`--test-reporter=tap`) for `gsd_run check tdd-red-evidence`

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- AUTH-03 API + Header chrome shipped; human UAT of Header menu flow still needed (coverage D2)
- Ready for 01-06 (remaining Identity spine plan)

---
*Phase: 01-identity-spine*
*Completed: 2026-09-21*

## Self-Check: PASSED
