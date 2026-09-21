---
phase: "1"
slug: "identity-spine"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-21"
validated: "2026-09-21"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` + Fastify `inject` (no Jest or Vitest) |
| **Config file** | none — `apps/plateflow-api/package.json` script `"test": "node --import tsx --test src/**/*.test.ts"` |
| **Quick run command** | `pnpm --filter @plateflow/api test` |
| **Full suite command** | `pnpm --filter @plateflow/api test` |
| **Estimated runtime** | ~35 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @plateflow/api test` plus `pnpm --filter @plateflow/api lint` (`tsc --noEmit`)
- **After every plan wave:** Run the same plus `pnpm --filter @plateflow/app lint`
- **Before `/gsd-verify-work`:** Full inject suite must be green; `grep mock_token_admin_` empty; `nfc_qr_auth_token_v2` only as a delete path; `/r/:slug` not behind jwt
- **Max feedback latency:** 35 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-00-01 | 00 | 0 | AUTH-01 | T-1-01 | Login sets HttpOnly SameSite=Lax cookies; `/me` 200 with cookie; logout clears | inject | `pnpm --filter @plateflow/api test` | ✅ | ✅ green |
| 1-00-02 | 00 | 0 | AUTH-01 | T-1-01 | `Authorization: Bearer mock_token_admin_1` 401 on `GET /api/plates`, `PUT` plates, and `PUT` redirects | inject | `pnpm --filter @plateflow/api test` | ✅ | ✅ green |
| 1-00-03 | 00 | 0 | AUTH-01 | T-1-01 | Missing cookie 401 on `GET /api/plates` | inject | `pnpm --filter @plateflow/api test` | ✅ | ✅ green |
| 1-00-04 | 00 | 0 | AUTH-03 | T-1-06 | Change password then login with new password; old refresh 401 | inject | `pnpm --filter @plateflow/api test` | ✅ | ✅ green |
| 1-00-05 | 00 | 0 | ANLY-04 | T-1-04 | `GET /api/analytics` 401 without cookie; 200 body has no `"ip"` | inject | `pnpm --filter @plateflow/api test` | ✅ | ✅ green |
| 1-00-06 | 00 | 0 | ANLY-04 | T-1-04 | `GET /api/plates` / `/api/templates` / `/api/redirects` 401 without cookie | inject | `pnpm --filter @plateflow/api test` | ✅ | ✅ green |
| 1-00-07 | 00 | 0 | SHOP-01 | — | `POST /api/plates/batch` 401 without cookie; 2xx with cookie; plate listed on GET | inject | `pnpm --filter @plateflow/api test` | ✅ | ✅ green |
| 1-00-08 | 00 | 0 | SCAN safety | T-1-05 | `GET /r/:slug` still not 401 (fixture or 404 HTML, not login JSON) | inject | `pnpm --filter @plateflow/api test` | ✅ | ✅ green |
| 1-00-09 | 00 | 0 | AUTH-01 | T-1-03 | Foreign origin + credentials must not allowlist `https://evil.example` | inject | `pnpm --filter @plateflow/api test` | ✅ | ✅ green |
| 1-00-10 | 00 | 0 | AUTH-01 | T-1-10 | POST/PUT/PATCH/DELETE with Origin `https://evil.example` returns 403 | inject | `pnpm --filter @plateflow/api test` | ✅ | ✅ green |
| 1-01-01 | 01 | 0 | AUTH-01 | — | API `test` script is `node --import tsx --test`; no Jest/Vitest | smoke | `node -e "const p=require('./apps/plateflow-api/package.json'); if(!String(p.scripts.test\|\|'').includes('node --import tsx --test')) process.exit(1)"` | ✅ | ✅ green |
| 1-01-02 | 01 | 0 | AUTH-01 | T-1-01 | Inject suite names AUTH-01/03, ANLY-04, SHOP-01, SCAN, CORS cases | inject | `pnpm --filter @plateflow/api exec node --import tsx --test src/auth/auth.inject.test.ts` | ✅ | ✅ green |
| 1-02-01 | 02 | 1 | AUTH-01 | T-1-01 | Cookie login unlocks `/me` and `GET /api/plates` | inject | `pnpm --filter @plateflow/api test` | ✅ | ✅ green |
| 1-02-02 | 02 | 1 | AUTH-01 | — | Identity SQL migration applies without recreating shop tables | integration | `pnpm --filter @plateflow/database migrate` | ✅ | ✅ green |
| 1-02-03 | 02 | 1 | AUTH-01 | T-1-01 | Walking-skeleton inject: login, forged bearer, missing cookie, SCAN, CORS | inject | `pnpm --filter @plateflow/api exec node --import tsx --test --test-name-pattern "AUTH-01 login\|AUTH-01 forged\|AUTH-01 missing cookie\|SCAN safety\|CORS foreign" src/auth/auth.inject.test.ts` | ✅ | ✅ green |
| 1-03-01 | 03 | 2 | AUTH-01 | T-1-01 | Refresh rotates until 8h; logout clears cookies and revokes refresh | inject | `pnpm --filter @plateflow/api exec node --import tsx --test --test-name-pattern "AUTH-01 refresh\|AUTH-01 logout" src/auth/auth.inject.test.ts` | ✅ | ✅ green |
| 1-03-02 | 03 | 2 | AUTH-01 | T-1-10 | Foreign Origin mutations return 403 | inject | `pnpm --filter @plateflow/api exec node --import tsx --test --test-name-pattern "AUTH-01 foreign Origin mutation 403" src/auth/auth.inject.test.ts` | ✅ | ✅ green |
| 1-03-03 | 03 | 2 | AUTH-01 | T-1-01 | SPA `apiFetch` uses credentials include and never sends Bearer | unit | `pnpm --filter @plateflow/api test` | ✅ | ✅ green |
| 1-04-01 | 04 | 3 | ANLY-04 | T-1-04 | Inventory and analytics list GETs refuse anonymous callers | inject | `pnpm --filter @plateflow/api exec node --import tsx --test --test-name-pattern "ANLY-04 inventory GETs" src/auth/auth.inject.test.ts` | ✅ | ✅ green |
| 1-04-02 | 04 | 3 | ANLY-04 | T-1-04 | Analytics JSON omits `ip`; UI does not interpolate `log.ip` | inject | `pnpm --filter @plateflow/api exec node --import tsx --test --test-name-pattern "ANLY-04 analytics 401 and no ip" src/auth/auth.inject.test.ts` | ✅ | ✅ green |
| 1-04-03 | 04 | 3 | ANLY-04 | T-1-04 | `fetchPlates` / `fetchAnalytics` / `fetchTemplates` return `[]` on 401 | unit | `pnpm --filter @plateflow/api test` | ✅ | ✅ green |
| 1-05-01 | 05 | 4 | AUTH-03 | T-1-06 | Own-password change; old refresh dead; new cookies keep the operator in | inject | `pnpm --filter @plateflow/api exec node --import tsx --test --test-name-pattern "AUTH-03 change password" src/auth/auth.inject.test.ts` | ✅ | ✅ green |
| 1-05-02 | 05 | 4 | AUTH-03 | T-1-06 | Header account menu exposes Alterar senha | unit | `pnpm --filter @plateflow/api test` | ✅ | ✅ green |
| 1-05-03 | 05 | 4 | AUTH-01 | T-1-01 | SPA logout POSTs `/api/auth/logout` | unit | `pnpm --filter @plateflow/api test` | ✅ | ✅ green |
| 1-06-01 | 06 | 5 | SHOP-01 | — | Cookie-gated batch persist; plate appears on subsequent GET | inject | `pnpm --filter @plateflow/api exec node --import tsx --test --test-name-pattern "SHOP-01 batch persist" src/auth/auth.inject.test.ts` | ✅ | ✅ green |
| 1-06-02 | 06 | 5 | SHOP-01 | — | `pendingLogout` defers LoginScreen until ZIP/`batchInFlight` ends | unit | `pnpm --filter @plateflow/api test` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `apps/plateflow-api/src/auth/auth.inject.test.ts` — AUTH-01/03, ANLY-04, SHOP-01 persist gate, public `/r/:slug`, CORS allowlist, foreign-Origin mutation 403
- [x] `apps/plateflow-api/src/auth/spa-identity-contracts.test.ts` — SPA cookie/Bearer/delete-path/401-empty/pendingLogout contracts
- [x] `apps/plateflow-api/package.json` `test` script: `node --import tsx --test src/**/*.test.ts`
- [x] Test `JWT_SECRET` / admin env fixtures; `NODE_ENV=test`
- [x] Framework install: none — `tsx` already in API `devDependencies`

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Header account menu Portuguese password-change form copy | AUTH-03 | Source contract covers menu labels; no component/browser runner for zinc chrome | Log in, open Header account menu, change password with current password, confirm copy matches LoginScreen Portuguese style |
| In-flight ZIP/canvas survives 401 until download starts (D-07) | SHOP-01 | `pendingLogout` is source-tested; canvas/ZIP timing is client-only | Start a print-lot compose; force access-cookie expiry mid-ZIP; download must finish; then LoginScreen if refresh fails |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 35s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-21

## Validation Audit 2026-09-21

| Metric | Count |
|--------|-------|
| Gaps found | 15 |
| Resolved | 15 |
| Escalated | 0 |

Nyquist audit (State A): seeded Wave 0 map was still `draft` / pending after execution. Existing inject suite already covered 1-00-01–1-00-10 (12/12 green). Adversarial gaps filled: cookie-unlocked `GET /api/plates`, logout refresh revoke, forged bearer on `PUT /api/redirects`, authed inventory GETs without `ip`, batch persist listed on GET, SameSite=Lax cookies, and SPA source contracts (`mock_token_admin_` gone, credentials/no Bearer, `nfc_qr_auth_token_v2` delete-only, logout POST, 401 empty lists, no `log.ip`, Header Alterar senha, `pendingLogout`). Suite: 24 pass / 0 fail.
