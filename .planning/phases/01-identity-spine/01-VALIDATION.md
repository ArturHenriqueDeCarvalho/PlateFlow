---
phase: "1"
slug: "identity-spine"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-21"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` + Fastify `inject` (no new package; do not add Jest or Vitest this phase) |
| **Config file** | none — Wave 0 installs `apps/plateflow-api/package.json` script `"test": "node --import tsx --test src/**/*.test.ts"` |
| **Quick run command** | `pnpm --filter @plateflow/api test` |
| **Full suite command** | `pnpm --filter @plateflow/api test` (no other API tests exist) |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @plateflow/api test` plus `pnpm --filter @plateflow/api lint` (`tsc --noEmit`)
- **After every plan wave:** Run the same plus `pnpm --filter @plateflow/app lint`
- **Before `/gsd-verify-work`:** Full inject suite must be green; `grep mock_token_admin_` empty; `nfc_qr_auth_token_v2` only as a delete path; `/r/:slug` not behind jwt
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-00-01 | 00 | 0 | AUTH-01 | T-1-01 | Login sets HttpOnly cookies; `/me` 200 with cookie; logout clears | inject | `pnpm --filter @plateflow/api test` | ❌ W0 | ⬜ pending |
| 1-00-02 | 00 | 0 | AUTH-01 | T-1-01 | `Authorization: Bearer mock_token_admin_1` 401 on `GET /api/plates` and `PUT` | inject | `pnpm --filter @plateflow/api test` | ❌ W0 | ⬜ pending |
| 1-00-03 | 00 | 0 | AUTH-01 | T-1-01 | Missing cookie 401 on `GET /api/plates` | inject | `pnpm --filter @plateflow/api test` | ❌ W0 | ⬜ pending |
| 1-00-04 | 00 | 0 | AUTH-03 | T-1-06 | Change password then login with new password; old refresh 401 | inject | `pnpm --filter @plateflow/api test` | ❌ W0 | ⬜ pending |
| 1-00-05 | 00 | 0 | ANLY-04 | T-1-04 | `GET /api/analytics` 401 without cookie; 200 body has no `"ip"` | inject | `pnpm --filter @plateflow/api test` | ❌ W0 | ⬜ pending |
| 1-00-06 | 00 | 0 | ANLY-04 | T-1-04 | `GET /api/plates` / `/api/templates` / `/api/redirects` 401 without cookie | inject | `pnpm --filter @plateflow/api test` | ❌ W0 | ⬜ pending |
| 1-00-07 | 00 | 0 | SHOP-01 | — | `POST /api/plates/batch` 401 without cookie; 200 with cookie (fixture qty 1) | inject | `pnpm --filter @plateflow/api test` | ❌ W0 | ⬜ pending |
| 1-00-08 | 00 | 0 | SCAN safety | T-1-05 | `GET /r/:slug` still not 401 (fixture or 404 HTML, not login JSON) | inject | `pnpm --filter @plateflow/api test` | ❌ W0 | ⬜ pending |
| 1-00-09 | 00 | 0 | AUTH-01 | T-1-03 | Foreign origin + credentials must not allowlist `https://evil.example` | inject | `pnpm --filter @plateflow/api test` | ❌ W0 | ⬜ pending |
| 1-00-10 | 00 | 0 | AUTH-01 | T-1-10 | POST/PUT/PATCH/DELETE with Origin `https://evil.example` returns 403 | inject | `pnpm --filter @plateflow/api test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/plateflow-api/src/auth/auth.inject.test.ts` — AUTH-01/03, ANLY-04, SHOP-01 persist gate, public `/r/:slug`, CORS allowlist, foreign-Origin mutation 403
- [ ] `apps/plateflow-api/package.json` `test` script: `node --import tsx --test src/**/*.test.ts`
- [ ] Test `JWT_SECRET` / admin env fixtures; `NODE_ENV=test`
- [ ] Framework install: none — `tsx` already in API `devDependencies`

Existing infrastructure does not cover these phase requirements until Wave 0 lands the inject suite.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Header account menu Portuguese password-change form | AUTH-03 | No component test runner this phase | Log in, open Header account menu, change password with current password, confirm copy matches LoginScreen Portuguese style |
| In-flight ZIP/canvas survives 401 until refresh (D-07) | SHOP-01 | Canvas/ZIP is client-only; Wave 0 must not block on it | Start a print-lot compose; force access-cookie expiry mid-ZIP; download must finish; then LoginScreen if refresh fails |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
