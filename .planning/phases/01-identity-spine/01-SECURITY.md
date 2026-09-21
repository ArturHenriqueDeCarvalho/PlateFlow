---
phase: "1"
slug: "identity-spine"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-09-21"
---

# Phase 1 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Test process → createFastifyApp | Tests must not weaken production fail-closed or public `/r/:slug` | Fixture secrets, inject cookies |
| Browser → POST /api/auth/login | Untrusted email/password; cookies set here | Credentials, session cookies |
| Browser → GET /api/plates | Must not leak inventory without cookie | Inventory JSON |
| Public → GET /r/:slug | Must remain anonymous | Slug, scan metadata (ip persisted, not returned) |
| App → Postgres | Seed and password hashes | ADMIN_* env, scrypt hashes |
| Browser → POST /api/auth/refresh | Opaque refresh cookie; rotation must invalidate prior value | Refresh cookie, new cookie pair |
| Foreign origin → mutating /api/* | CSRF via cookies | Origin header, cookie-authenticated mutations |
| Anonymous browser → GET /api/analytics and list GETs | Must 401; must not include ip | Analytics/inventory JSON |
| Scan write path → analytics.ip column | May persist; must not round-trip to operators | Client IP |
| Authenticated browser → POST /api/auth/change-password | Current password is a secret; new hash stored | Current/new password |
| Stolen refresh after password change | Must 401 | Old refresh cookie |
| Authenticated browser → POST /api/plates/batch | Lot metadata; must be cookie-auth only | Plate/redirect lot |
| In-flight canvas/ZIP → App user state | Clearing user unmounts the modal and loses the blob | Session clear vs ZIP blob |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-1-00 | Tampering | auth.inject.test.ts | low | accept | Fixture secrets only when `NODE_ENV=test`; `.env*` gitignored | closed |
| T-1-01 | Elevation of Privilege | authMiddleware.ts / AuthController.ts | high | mitigate | `jwtVerify({ onlyCookie: true })`; prefix/Bearer bypass removed | closed |
| T-1-02 | Information Disclosure | storageService.ts / sessionCookies.ts | high | mitigate | HttpOnly cookies; `Authorization` stripped; legacy token keys forgotten | closed |
| T-1-03 | Information Disclosure | app.ts CORS | high | mitigate | `APP_ORIGIN` allowlist; no arbitrary Origin reflection with credentials | closed |
| T-1-04 | Information Disclosure | GET /api/plates | high | mitigate | `requireAuth` on `GET /` in plateRoutes | closed |
| T-1-05 | Denial of Service | publicRedirectRoutes.ts | high | mitigate | No `jwtVerify` / `requireAuth` on `/r/:slug` or resolve | closed |
| T-1-06 | Elevation of Privilege | seedAdminUser.ts | high | mitigate | `onConflictDoNothing`; production fail-closed without `JWT_SECRET` and admin env | closed |
| T-1-07 | Information Disclosure | ScryptPasswordHasher.ts | medium | mitigate | scrypt `N=131072` + `maxmem`; `timingSafeEqual` | closed |
| T-1-08 | Elevation of Privilege | login brute force | medium | accept | AUTH-04 lockout deferred to v2; internal-tool ASVS L1 | closed |
| T-1-09 | Elevation of Privilege | RefreshSessionUseCase.ts | high | mitigate | Rotate token hash on every refresh; reject revoked and expired `sessionExpiresAt` | closed |
| T-1-10 | Tampering | requireOrigin.ts | medium | mitigate | Reject set Origin not in `APP_ORIGIN` on POST/PUT/PATCH/DELETE; SameSite Lax cookies | closed |
| T-1-11 | Information Disclosure | sessionCookies.ts / AuthController | medium | mitigate | Refresh cookie `path: /api/auth`; refresh never in JSON or localStorage | closed |
| T-1-12 | Information Disclosure | analyticsRoutes.ts / mapRow | high | mitigate | `requireAuth` on GET `/api/analytics`; `mapRow` omits `ip` | closed |
| T-1-13 | Information Disclosure | storageService fetch* cache | high | mitigate | 401 → `clearSessionUnlessBatchInFlight` + `[]`; no authenticated paint from cache | closed |
| T-1-14 | Denial of Service | public resolve | high | mitigate | `publicRedirectRoutes` has no `requireAuth` on `/r/:slug` or `/api/redirects/:slug/resolve` | closed |
| T-1-15 | Elevation of Privilege | ChangePasswordUseCase.ts | high | mitigate | Require current password; `revokeAllForUser` then new cookie pair | closed |
| T-1-16 | Information Disclosure | Header.tsx password fields | medium | mitigate | `type="password"`; toast is `Senha alterada.` (no secret echo) | closed |
| T-1-17 | Elevation of Privilege | POST /api/plates/batch | high | mitigate | `requireAuth` on route; `persistBatch` via `apiFetch` (`credentials: include`, no Bearer) | closed |
| T-1-18 | Denial of Service | BatchGeneratorModal unmount | medium | mitigate | `pendingLogout` waits until `batchInFlight`/`isProcessing` is false (D-07) | closed |
| T-1-SC | Tampering | @fastify/jwt + @fastify/cookie | high | mitigate | RESEARCH legitimacy OK for 10.2.2 / 11.1.2; no postinstall on either package; later plans added no new packages | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (`high`) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

### Verification evidence (ASVS L1)

| Threat ID | Evidence |
|-----------|----------|
| T-1-00 | `apps/plateflow-api/src/auth/auth.inject.test.ts:5-10` (`NODE_ENV=test` fixtures); `.gitignore` `.env*` |
| T-1-01 | `apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts:14`; `AuthController.ts:83` |
| T-1-02 | `apps/plateflow-api/src/infrastructure/auth/sessionCookies.ts:25-37`; `storageService.ts:97-108`, `21-34` |
| T-1-03 | `apps/plateflow-api/src/infrastructure/http/app.ts:17-54` |
| T-1-04 | `apps/plateflow-api/src/infrastructure/http/routes/plateRoutes.ts:24` |
| T-1-05 | `publicRedirectRoutes.ts` has no `jwtVerify`/`requireAuth`; `app.ts:73` (no global jwtVerify) |
| T-1-06 | `apps/plateflow-api/src/infrastructure/auth/seedAdminUser.ts:8-17`, `33-43` |
| T-1-07 | `apps/plateflow-api/src/infrastructure/crypto/ScryptPasswordHasher.ts:4-8`, `59` |
| T-1-08 | Accepted — AUTH-04 lockout deferred (see Accepted Risks Log) |
| T-1-09 | `apps/plateflow-api/src/core/use-cases/auth/RefreshSessionUseCase.ts:28-39` |
| T-1-10 | `apps/plateflow-api/src/infrastructure/http/middleware/requireOrigin.ts:14-27`; `app.ts:74` |
| T-1-11 | `sessionCookies.ts:32-38`; `AuthController.ts:45`, `71` (JSON body is `{ user }` only) |
| T-1-12 | `analyticsRoutes.ts:11`; `DrizzleAnalyticsRepository.ts:38-52` (no `ip` in mapRow) |
| T-1-13 | `storageService.ts:253-255`, `318-320`, `372-374`, `582-584` |
| T-1-14 | `publicRedirectRoutes.ts:220-221` registered without auth preHandler |
| T-1-15 | `ChangePasswordUseCase.ts:41-48` |
| T-1-16 | `Header.tsx:369-405`; `App.tsx:403-405` |
| T-1-17 | `plateRoutes.ts:25`; `storageService.ts:492-500` |
| T-1-18 | `App.tsx:143-148`, `574`; `BatchGeneratorModal.tsx:44`; `storageService.ts:149-165` |
| T-1-SC | `apps/plateflow-api/package.json:14,17`; RESEARCH Package Legitimacy Audit OK; no `postinstall` on `@fastify/jwt@10.2.2` or `@fastify/cookie@11.1.2` |

`register_authored_at_plan_time: true` — all six PLAN files contained a parseable `<threat_model>`.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-1-00 | T-1-00 | Inject suite uses fixture `JWT_SECRET` / admin env only when `NODE_ENV=test`. Secrets are not committed (`.env*` gitignored). | plan 01-01 + secure-phase 2026-09-21 | 2026-09-21 |
| AR-1-08 | T-1-08 | AUTH-04 login lockout is deferred to v2. Internal single-operator tool at ASVS L1; brute-force residual accepted for this milestone. | plan 01-02 + secure-phase 2026-09-21 | 2026-09-21 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-21 | 20 | 20 | 0 | gsd-secure-phase / gsd-security-auditor (ASVS L1, block_on high) |

### Unregistered Flags

None. `01-06-SUMMARY.md` ## Threat Flags maps to T-1-17 and T-1-18. Other plan SUMMARYs have no unmapped flags.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-21
