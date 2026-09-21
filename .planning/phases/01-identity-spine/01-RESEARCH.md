# Phase 1: Identity spine - Research

**Researched:** 2026-09-21
**Domain:** Fastify 5 HttpOnly cookie JWT + scrypt users table + lock inventory GETs (brownfield PWA)
**Confidence:** HIGH for stack wiring and codebase seams; MEDIUM for CSRF extra token vs Origin check (discretion)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
Carried forward from PROJECT.md / research (do not re-open):
- `@fastify/jwt` + Node `crypto.scrypt`; no Better Auth, Supabase Auth, Redis sessions, or Argon2
- Delete `mock_token_admin_*` in the **same** change that introduces signed tokens; collapse to one session mechanism
- Seed the first admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` into a `users` table; remove compiled `admin@plateflow.com` / `plateflow2026` and plaintext env compare after seed
- Fail closed in production if `JWT_SECRET` (and admin seed env) are missing
- `requireAuth` on inventory/analytics/template GETs; never put `jwtVerify` on `/r/:slug`
- Strip `ip` from analytics JSON DTOs (not a UI-only hide)
- Allowlist CORS (`APP_ORIGIN`) in the same PR as the real session — current `origin: true` + `credentials: true` is unsafe once cookies exist
- Do not rebuild the print console (SHOP-01)

### Session transport
- **D-01:** Session is **HttpOnly cookie only**. Remove Bearer tokens from JS and delete `localStorage` keys `nfc_qr_auth_token_v2` and leftover `plateflow_auth_token`. `StorageService` `fetch` uses `credentials: 'include'`. JavaScript must not read the session. — **Reversibility:** costly — every authenticated `fetch`, login/logout/`/me`, CORS, and CSRF story depend on this; a later Bearer revival would retouch the SPA and `requireAuth`.
- **D-02:** Same-origin is the supported login path (unified `pnpm dev` / `server.ts` and production host). Standalone Vite `:5173` talking to a different API origin is not a cookie-session target.

### Session lifetime
- **D-03:** Hard **8 hour** ceiling from login. Short-lived access cookie plus refresh cookie valid until that 8h mark. Silent refresh while the operator navigates. After 8h they see `LoginScreen` again — no sliding window that can last days. — **Reversibility:** costly — needs a refresh-token persistence/rotation design; changing TTL later is easy, dropping refresh after clients rely on silent renew is not.
- **D-04:** Both access and refresh live in HttpOnly cookies (`Secure` in production, `SameSite=Lax`). No refresh token in `localStorage` or response JSON.

### Password change
- **D-05:** AUTH-03 in this phase: the logged-in operator changes **their own** password (current password required). Entry point is an **account menu in the existing `Header`** (alongside the current logout control) — not a new settings route.
- **D-06:** After a successful password change, existing sessions for that user must not keep working on the old refresh (re-login or rotate/revoke refresh). Planner chooses the exact revoke mechanism.

### Expired session during print lot
- **D-07:** Never abort an in-flight client ZIP/canvas (`BatchGeneratorModal` / `imageComposerService`). Silent refresh in the background keeps the session. If refresh fails, **finish the download**, then send the operator to `LoginScreen`. Persist (`POST /api/plates/batch`) may retry once after a successful silent refresh; do not lose the composed ZIP because of a 401.

### Claude's Discretion
- Exact access-token TTL inside the 8h window (minutes vs tens of minutes), refresh rotation, CSRF defense (`SameSite` vs extra token), cookie names, and scrypt/JWT plugin wiring — follow `.planning/research/SUMMARY.md` and STACK research unless they conflict with D-01–D-07.
- Copy and visual treatment of the Header account menu: keep existing zinc/Tailwind console; Portuguese UI like `LoginScreen`.
- Whether `AUTH_USER` profile (email/role, not the token) may remain in `localStorage` for instant shell paint — allowed if `/me` is the source of truth and 401 always `logout()` (never restore a session from cache when `/me` fails).

### Deferred Ideas (OUT OF SCOPE)
- **Admin can set any user’s password; a user can only change their own.** Other users do not exist until Phase 3 (AUTH-02 / ownership). Note for Phase 3: admin password-reset of others is **not** the same as create/deactivate — add it when users are provisioned.
- Login rate-limit + persisted lockout (AUTH-04) and forgot-password (AUTH-05) stay v2.
- Forced first-login password change after env seed is v2 (“forced password reset” in research defer list). Optional prompt is not in scope unless it falls out of D-05.
- Unique `plates.slug`, `owner_id` / `assigned_user_id` columns, and user provisioning are not this phase’s success criteria (schema for `users` **is** required for AUTH-03 and the seeded admin).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Admin and user can log in, log out, and call `/me` with a signed JWT; `mock_token_admin_*` no longer authenticates | `@fastify/jwt` cookie + `onlyCookie: true`; delete prefix middleware in the same change; seed `users`; `/api/auth/login` `/me` `/logout` `/refresh` |
| AUTH-03 | A logged-in user can change their own password | `ChangePasswordUseCase` + Header account menu; revoke `refresh_sessions` then issue a fresh pair (D-06) |
| ANLY-04 | Inventory and analytics GETs require auth; response DTOs and UI omit IP (IP may remain in the database) | `requireAuth` on GET plates/redirects/templates/analytics; strip `ip` in `DrizzleAnalyticsRepository.mapRow`; dashboard already omits IP in UI |
| SHOP-01 | Admin can manage plate templates and generate print lots with QR stamped on artwork | Do not rebuild `TemplateManager` / `BatchGeneratorModal`; switch batch POST to `credentials: 'include'`; D-07 ZIP-then-login |
</phase_requirements>

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` (or `.claude/.cursor/rules/`) files exist in this workspace. Planner follows CONTEXT.md locked decisions, Clean Architecture in `.planning/codebase/ARCHITECTURE.md`, and existing Portuguese `{ error }` controller responses.

## Summary

Phase 1 replaces a forgeable `mock_token_admin_*` Bearer prefix with a **same-origin HttpOnly cookie session**. The API already has Clean Architecture (Route → Controller → UseCase → Repository) and a Fastify plugin composition root in `createFastifyApp()`. Plug `@fastify/cookie` then `@fastify/jwt` there; keep JWT/scrypt in infrastructure; add `LoginUseCase` / `ChangePasswordUseCase` / `IPasswordHasher` / `ITokenIssuer` / `IRefreshSessionRepository` in `core/`. Seed one admin into a new `users` table from `ADMIN_EMAIL` / `ADMIN_PASSWORD` with **ON CONFLICT DO NOTHING** so later boots cannot overwrite AUTH-03.

D-01–D-04 override earlier project research that allowed a Bearer fallback and an 8h access JWT with no refresh store. `@fastify/jwt` **falls back to `Authorization` unless `onlyCookie: true`**. Set that flag so a forged Bearer cannot ride beside cookies. Refresh is an **opaque** HttpOnly cookie persisted as a SHA-256 hash in `refresh_sessions` (revocable on password change); access is a short JWT in a second HttpOnly cookie. CORS `origin: true` must become an `APP_ORIGIN` allowlist in the same PR.

**Primary recommendation:** Walking skeleton = seed admin + cookie login/`/me` + `requireAuth` on `GET /api/plates` + LoginScreen still works; then expand to refresh/logout, GET locks, IP strip, Header password change, CORS, and cookie-backed print-lot persist without touching canvas/ZIP composition.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Login / logout / `/me` / refresh | API / Backend | Browser / Client | Fastify sets/clears HttpOnly cookies; SPA only `credentials: 'include'` and React `user` state |
| Password hashing (scrypt) | API / Backend | — | Never in the browser; Node `crypto.scrypt` in infrastructure hasher |
| Access JWT sign/verify | API / Backend | — | `@fastify/jwt` `jwtSign` / `jwtVerify`; `requireAuth` preHandler |
| Refresh session revoke (D-06) | Database / Storage | API / Backend | `refresh_sessions` rows; password change deletes/revokes by `user_id` |
| Admin seed | API / Backend | Database / Storage | Boot-time idempotent insert into `users` |
| Inventory/analytics/template GET lock | API / Backend | — | `requireAuth` on list routes; SPA must not treat 401 as cache hit |
| IP omission (ANLY-04) | API / Backend | Database / Storage | Strip in mapper; column stays on `analytics.ip` |
| CORS allowlist | API / Backend | CDN / Static | `@fastify/cors` `origin` = `APP_ORIGIN`; same-origin PWA |
| LoginScreen / Header account menu | Browser / Client | — | Existing zinc/Tailwind; no client router |
| Print lot ZIP + QR stamp (SHOP-01) | Browser / Client | API / Backend | Canvas/JSZip stays in the SPA; persist `POST /api/plates/batch` with cookies |
| Public scan `GET /r/:slug` | API / Backend | — | Actor-free; never `jwtVerify` |
| Instant shell paint (`AUTH_USER`) | Browser / Client | API / Backend | Optional localStorage profile only; `/me` is session truth |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `fastify` | `^5.2.1` in repo (npm latest `5.12.5`) | HTTP API | Already the server; stay on 5.x `[CITED: apps/plateflow-api/package.json]` |
| `@fastify/jwt` | `10.2.2` (install `^10.2.2`) | HS256 access JWT | Official Fastify 5 plugin (`>=9`); cookie + `onlyCookie` `[VERIFIED: npm registry 10.2.2 published 2026-08-14; legitimacy OK]` |
| `@fastify/cookie` | `11.1.2` (install `^11.1.2`) | Parse/set HttpOnly cookies | Required for JWT cookie mode; Fastify 5 = `>=10.x` `[VERIFIED: npm registry 11.1.2; legitimacy OK]` |
| `@fastify/cors` | `^10.0.1` already installed (npm latest `11.3.0`) | Origin allowlist | Keep installed major; **change config only** — do not upgrade in this phase `[CITED: apps/plateflow-api/package.json]` |
| Node `crypto.scrypt` | Node 22 API (runtime probed Node v24.14.0) | Password hash | Locked; no `argon2` package `[CITED: nodejs.org crypto.scrypt]` |
| `drizzle-orm` + `drizzle-kit` | `^0.45.2` / `^0.31.10` in repo | `users` + `refresh_sessions` | Existing persistence; committed SQL, not prod `db:push` `[CITED: packages/database/package.json]` |
| React 19 + Vite 6 + Tailwind 4 | repo | Console UI | Keep `LoginScreen` / `Header`; no router `[CITED: .planning/codebase/STACK.md]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node `node:test` | built-in | Fastify `inject` auth contract tests | Wave 0 — **do not add Jest**; do not add Vitest this phase |
| `@fastify/formbody` | `^8.0.1` already | URL-encoded bodies | Unchanged |
| Fastify JSON Schema | built-in | Validate login / change-password bodies | Do not add Zod this phase |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Opaque refresh + `refresh_sessions` | JWT refresh in cookie (`@fastify/jwt` `onlyCookie` example) | JWT refresh is not revocable without a denylist; D-06 needs revoke — use the table |
| `SameSite=Lax` + Origin check | `@fastify/csrf` cookie-to-header | Extra JS-readable token fights D-01 spirit; Lax already blocks cross-site POST. Origin check is enough for this same-origin SPA |
| `node:test` | `vitest@5.0.1` | Vitest is the project-research default, but legitimacy this session is **SUS (`too-new`)** — skip unless human verifies |
| `@fastify/helmet` | skip this phase | CSP/helmet can break Pix/vCard inline HTML; public harden is Phase 2 |
| `@fastify/rate-limit` | skip this phase | AUTH-04 is v2 / deferred |
| Node `crypto.argon2` (present on this machine’s Node 24) | locked out | CONTEXT forbids Argon2 |

**Installation:**

```bash
pnpm --filter @plateflow/api add @fastify/jwt@^10.2.2 @fastify/cookie@^11.1.2
pnpm --filter @plateflow/database db:generate -- --custom --name add-identity-tables
# then hand-write CREATE TABLE SQL (see Architecture); apply with drizzle-kit migrate
```

**Version verification (this session):** `@fastify/jwt@10.2.2`, `@fastify/cookie@11.1.2`, `fastify@5.12.5` on npm; neither jwt nor cookie has `scripts.postinstall`. Repo Fastify stays `^5.2.1`. Do not bump Fastify.

**Discretion recommendations (planner should treat as defaults, not re-open locks):**

| Decision | Recommendation | Why |
|----------|----------------|-----|
| Access TTL | **15 minutes** | Silent refresh covers navigation; ZIP persist can retry once (D-07). Access `exp` = `min(now+15m, session_expires_at)` |
| Cookie names | `plateflow_access`, `plateflow_refresh` | Two cookies; STACK’s single `plateflow_token` is obsolete under D-04 `[ASSUMED names]` |
| Refresh | Opaque 32-byte `crypto.randomBytes`, store SHA-256 hex | Revocable; not a JWT |
| Rotation | Rotate refresh on every `/api/auth/refresh` | Stolen refresh has one use |
| CSRF | `SameSite=Lax` (locked) **plus** reject mutating requests whose `Origin` is set and not in `APP_ORIGIN` | No extra CSRF cookie |
| `AUTH_USER` cache | Keep `nfc_qr_auth_user_v2` for shell paint only | 401 → `logout()`; never return cache from `verifyAuth` on `/me` failure |
| Password change session | Revoke **all** refresh rows for that user, then set a **new** cookie pair in the same 200 | Operator stays in the console; old refresh 401s |

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@fastify/jwt` | npm | since 2022-04-27; 10.2.2 on 2026-08-14 | ~609k/wk | github.com/fastify/fastify-jwt | OK | Approved |
| `@fastify/cookie` | npm | 11.1.2 on 2026-07-15 | ~2.0M/wk | github.com/fastify/fastify-cookie | OK | Approved |
| `vitest` | npm | 5.0.1 on 2026-09-15 | ~75M/wk | github.com/vitest-dev/vitest | SUS (`too-new`) | **REMOVED from this phase** — use `node:test` |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `vitest@5.0.1` — not installed; if a later plan wants Vitest, add `checkpoint:human-verify`

No new hashing packages. No JWT denylist package.

## Architecture Patterns

### System Architecture Diagram

```text
Operator browser (same origin: server.ts :3005 or Vercel host)
  │  LoginScreen POST /api/auth/login  JSON {email,password}  credentials:include
  │  Header  POST /api/auth/logout | POST /api/auth/change-password | POST /api/auth/refresh
  ▼
Fastify createFastifyApp()
  cors(APP_ORIGIN allowlist, credentials:true)
  cookie plugin (onRequest parse)
  jwt plugin (cookieName=plateflow_access, onlyCookie:true, secret=JWT_SECRET)
  requireAuth ──► jwtVerify() ──► load users by sub ──► reject if missing/active=false
        │
        ├─ PUBLIC (no jwtVerify): GET /r/:slug , GET /api/redirects/:slug/resolve , GET /api/health , POST /api/auth/login
        ├─ COOKIE AUTH: GET /api/auth/me , POST /api/auth/refresh (refresh cookie), POST /api/auth/logout
        └─ requireAuth: GET/POST/PUT/DELETE plates|redirects|templates|analytics (lists + mutations)
              │
              ▼
         core use cases (no Fastify import)
              │
              ▼
         Postgres  users + refresh_sessions + existing plates/redirects/templates/analytics
```

Walking skeleton path: `POST /login` → Set-Cookie pair → `GET /me` → `GET /api/plates` 200 with cookie / 401 without → LoginScreen still the gate.

### Recommended Project Structure

```
packages/database/src/schema/index.ts     # add users, refresh_sessions
packages/database/drizzle/                # first committed SQL (identity tables only)
apps/plateflow-api/src/core/repositories/IUserRepository.ts
apps/plateflow-api/src/core/repositories/IRefreshSessionRepository.ts
apps/plateflow-api/src/core/ports/IPasswordHasher.ts
apps/plateflow-api/src/core/ports/ITokenIssuer.ts
apps/plateflow-api/src/core/use-cases/auth/LoginUseCase.ts
apps/plateflow-api/src/core/use-cases/auth/ChangePasswordUseCase.ts
apps/plateflow-api/src/infrastructure/crypto/ScryptPasswordHasher.ts
apps/plateflow-api/src/infrastructure/auth/FastifyTokenIssuer.ts
apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts  # jwtVerify onlyCookie
apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts
apps/plateflow-api/src/infrastructure/http/app.ts                        # cookie, jwt, CORS, seed, fail-closed
apps/plateflow-app/src/services/storageService.ts                        # credentials include, no Bearer
apps/plateflow-app/src/components/Header.tsx                             # account menu + change-password modal
apps/plateflow-api/src/auth/*.test.ts                                    # node:test + inject
```

Do not add `react-router`. Do not compose a second auth client in the SPA.

### Pattern 1: Cookie-only JWT verify (no Bearer fallback)

**What:** Register cookie before JWT. `jwtVerify` looks at `req.cookies[cookieName]`. Default plugin **also** accepts `Authorization` if the cookie is empty or both headers exist — that would keep `mock_token_admin_*` viable if anyone still sends it. D-01 requires `onlyCookie: true`.

**When to use:** Every `requireAuth` and `GET /api/auth/me`.

**Example:**

```javascript
// Source: https://github.com/fastify/fastify-jwt/blob/master/README.md (cookie + onlyCookie)
fastify.register(jwt, {
  secret: 'foobar',
  cookie: {
    cookieName: 'token',
    signed: false
  }
})
fastify.register(require('@fastify/cookie'))
// onlyCookie: decode only the cookie; Authorization is ignored
fastify.addHook('onRequest', (request) => request.jwtVerify({onlyCookie: true}))
```

**PlateFlow wiring (prescriptive):** do **not** put `jwtVerify` on a global `onRequest` (that 401s `/r/:slug`). Register plugins in `createFastifyApp`, then `preHandler: [requireAuth]` per route. Cookie name is `plateflow_access` (discretion). `signed: false` — the JWT is already signed; a second cookie signature is unnecessary.

### Pattern 2: Dual cookie — short JWT access + opaque refresh

**What:** Access JWT claims `sub`, `role`, `email`, `sid` (refresh session id), `exp`. Refresh cookie is not a JWT. `/api/auth/refresh` reads `plateflow_refresh`, hashes it, looks up `refresh_sessions`, checks `revoked_at IS NULL` and `now < session_expires_at` (login+8h), rotates the opaque value, signs a new access JWT.

**When to use:** Always for D-03/D-04/D-06.

Login response JSON is `{ user }` only — **no `token` field**.

### Pattern 3: Idempotent admin seed

**What:** After migrations, `INSERT` the env admin with scrypt hash. Unique email. `ON CONFLICT (email) DO NOTHING`. Never `UPDATE password_hash` from env on boot (that would undo AUTH-03).

**When to use:** `createFastifyApp()` next to `seedDefaultTemplates()`, gated on `DATABASE_URL`.

Fail closed when `NODE_ENV === 'production'` **or** `VERCEL` is set: missing `JWT_SECRET` (min 32 bytes) or missing `ADMIN_EMAIL` / `ADMIN_PASSWORD` throws before listen. Dev may still boot without seed if those env vars exist for local login.

### Pattern 4: SPA `credentials: 'include'` wrapper

**What:** One `apiFetch` in `StorageService`. All `/api/*` except public scan use it. On 401 (and URL is not `/api/auth/login|refresh|logout`): `POST /api/auth/refresh` once, retry original. If refresh fails: if ZIP in-flight, set `pendingLogout` and return the 401 to the caller without `setUser(null)`; else `logout()` and clear `AUTH_USER`.

**When to use:** Every authenticated call, including `App.tsx` `POST /api/plates/batch` (move that leak onto `StorageService`).

### Anti-Patterns to Avoid

- **Global `onRequest` `jwtVerify`:** 401s printed plates (`GET /r/:slug`).
- **Bearer fallback “for scripts”:** D-01 forbids; `onlyCookie` must be on.
- **Seed overwrites password every boot:** breaks AUTH-03.
- **First drizzle generate of the whole schema against a `db:push` database:** `CREATE TABLE templates` will fail in prod. Custom SQL for **new tables only**.
- **Treat GET 401 as localStorage cache hit:** today’s `fetchPlates` / `fetchAnalytics` already do this — after GET locks, that paints a stale shop dump for an anonymous tab.
- **Abort `BatchGeneratorModal` by setting `user=null` mid-canvas:** D-07. Gate logout on `!isProcessing`.
- **Put `ip` only behind a UI hide:** strip in `mapRow`.
- **Add `GET /api/redirects/:slug` with `requireAuth`:** collides with public `GET /api/redirects/:slug/resolve`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT sign/verify | Custom HMAC + `jsonwebtoken` | `@fastify/jwt` | Plugin wraps `fast-jwt`; cookie lookup; Fastify 5 support |
| Cookie parse/Set-Cookie | Manual `Set-Cookie` strings | `@fastify/cookie` `reply.setCookie` / `clearCookie` | Path/Secure/SameSite flags; `req.cookies` |
| Password hashing | SHA-256 / bcrypt / homemade PBKDF | `crypto.scrypt` with raised `maxmem` | Locked; OWASP-class KDF without native addons |
| Session store | Redis / in-memory Map | Postgres `refresh_sessions` | Vercel isolates do not share memory; D-06 revoke |
| Test HTTP | Jest + supertest | Fastify `inject` + `node:test` | Repo forbids Jest; inject is first-party |
| CSRF token framework | `@fastify/csrf` | SameSite=Lax + Origin allowlist | Same-origin SPA; extra cookie is JS-readable |
| Auth product | Better Auth / Supabase Auth | Existing `AuthController` | Locked out |

**Key insight:** The expensive parts are cookie flags, revoke, CORS, and not 401-ing `/r/:slug` — not inventing JWT.

## Runtime State Inventory

This phase migrates the **session mechanism** (localStorage Bearer → HttpOnly cookies). After source is updated, these runtime stores still hold the old string.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | No `users` / session tables today. Analytics `ip` column remains. Operator browsers hold `nfc_qr_auth_token_v2`, leftover `plateflow_auth_token`, `nfc_qr_auth_user_v2` | Code: delete token keys on load/login/logout. No DB migration of tokens (none stored). Profile key may remain |
| Live service config | `JWT_SECRET` listed in Turbo but unread. `ADMIN_EMAIL` / `ADMIN_PASSWORD` compared in process memory. Vercel env must gain `JWT_SECRET` + `APP_ORIGIN` | Set env on host; fail closed if missing in prod. CORS allowlist is code + env, not a dashboard |
| OS-registered state | None — verified by no Task Scheduler / systemd / pm2 config in repo | none |
| Secrets/env vars | `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` in `turbo.json` `globalEnv`. `.env.example` has those plus `APP_URL` (not `APP_ORIGIN`) | Add `APP_ORIGIN` to `.env.example` and `turbo.json`. Do not commit `.env`. After seed, env password is **seed-only** |
| Build artifacts | esbuild API bundle externals `@fastify/*` already — new plugins load from `node_modules` at runtime | Reinstall API deps; no extra esbuild flag if `@fastify/*` stays external |

**Nothing found:** no Redis sessions, no Auth SaaS tenants, no OS tasks named PlateFlow.

## Common Pitfalls

### Pitfall 1: Auth theater — JWT beside `mock_token_admin_`
**What goes wrong:** Prefix check remains; `/me` hydrates from the prefix; dual localStorage keys.
**Why it happens:** “Ship users first, swap tokens later.”
**How to avoid:** Delete `startsWith('mock_token_admin_')` in middleware **and** `AuthController.me` in the same commit as cookies. Grep must be empty. `onlyCookie: true`.
**Warning signs:** `Authorization: Bearer mock_token_admin_1` still 200s `PUT /api/redirects/:slug`.

### Pitfall 2: `@fastify/jwt` Bearer fallback
**What goes wrong:** Cookie option enabled, but empty cookie + `Authorization` still verifies (or mock prefix still parsed before jwt).
**Why it happens:** README: fallback when cookie empty or both headers present.
**How to avoid:** Plugin/verify `onlyCookie: true`. Do not send Bearer from JS.
**Warning signs:** Network tab still has `Authorization: Bearer`.

### Pitfall 3: scrypt `N=131072` without `maxmem`
**What goes wrong:** Login/seed throws `Invalid scrypt params: ... memory limit exceeded`.
**Why it happens:** Node default `maxmem` is `32 * 1024 * 1024`; docs: error when approx `128 * N * r > maxmem`.
**How to avoid:** Always pass `maxmem: 256 * 1024 * 1024` (or higher) with `N: 131072`, `r: 8`, `p: 1`.
**Warning signs:** First admin seed crashes the isolate.

**Probe this session (paste):**
`N=131072 default maxmem: FAIL Invalid scrypt params: error:030000AC:digital envelope routines::memory limit exceeded`
`N=131072 maxmem=256MiB: OK`

### Pitfall 4: CORS `origin: true` + cookie credentials
**What goes wrong:** Hostile origin reflected + cookies sent.
**Why it happens:** Fastify CORS README marks `origin: true` as **not recommended for production** (reflection exploits).
**How to avoid:** `origin: APP_ORIGIN.split(',')` (or a string). Same-origin unified host. Do **not** allowlist Vite `:5173` (D-02). Requests with no `Origin` (curl, server) still work.
**Warning signs:** Random origin gets `Access-Control-Allow-Origin: <that origin>` and credentials.

### Pitfall 5: First Drizzle migration recreates existing tables
**What goes wrong:** Empty `packages/database/drizzle/` + `db:generate` emits `CREATE TABLE templates|plates|redirects|analytics`. Prod already has them via `db:push`. `migrate.ts` today only `SELECT`s and seeds — it does **not** apply SQL.
**Why it happens:** Generate diffs snapshots, not the live DB; no journal exists.
**How to avoid:** `drizzle-kit generate --custom --name add-identity-tables` and write **only** `users` + `refresh_sessions`. Replace `migrate.ts` with `drizzle-kit migrate` / `migrate({ migrationsFolder: './drizzle' })`. Review SQL before apply.
**Warning signs:** Migration error `relation "templates" already exists`.

### Pitfall 6: GET 401 falls back to localStorage inventory
**What goes wrong:** Anonymous or expired session still sees plates/IPs from cache.
**Why it happens:** `fetchPlates` / `fetchAnalytics` `catch` / non-ok → `getPlates()`.
**How to avoid:** On 401, `logout()` and return `[]` (or throw). Never treat cache as an authenticated read.
**Warning signs:** Logged-out tab still shows “Últimas Leituras”.

### Pitfall 7: Logout mid-ZIP unmounts the modal
**What goes wrong:** Access expires during `generateBatchZip`; refresh fails; `setUser(null)` unmounts `BatchGeneratorModal` and the blob is lost.
**Why it happens:** Auth gate in `App.tsx` returns `LoginScreen` when `!user`.
**How to avoid:** `batchInFlight` / `pendingLogout` flag (D-07). Finish download, then `setUser(null)`. Persist retries once after refresh.
**Warning signs:** Operator sees login while the ZIP progress bar is still running.

### Pitfall 8: Seed + compiled defaults
**What goes wrong:** Unset env still accepts `admin@plateflow.com` / `plateflow2026`.
**How to avoid:** Delete those string literals. Production boot throws without env. After seed, authenticate only against `users.password_hash`.
**Warning signs:** Login works on a production deploy with empty env.

### Pitfall 9: `requireAuth` on the resolve path
**What goes wrong:** Physical scans 401.
**How to avoid:** Public routes stay `GET /r/:slug` and `GET /api/redirects/:slug/resolve`. List is `GET /api/redirects` only.
**Warning signs:** Scanning a plate opens LoginScreen (via API 401) or HTML 401.

## Code Examples

Verified / cited patterns. Discrete in-repo values quoted from files read this session.

### Current login token (must die in the same change)

```typescript
// Source: apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts:5-16
const adminEmail = process.env.ADMIN_EMAIL || 'admin@plateflow.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'plateflow2026';
if (email === adminEmail && password === adminPassword) {
  const token = `mock_token_admin_${Date.now()}`;
```

```typescript
// Source: apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts:4-7
const token = authHeader?.replace(/^Bearer\s+/i, '') || (req.headers['x-auth-token'] as string);
if (!token || !token.startsWith('mock_token_admin_')) {
```

### Current SPA token keys (delete)

```typescript
// Source: apps/plateflow-app/src/services/storageService.ts:10-16
const STORAGE_KEYS = {
  AUTH_TOKEN: 'nfc_qr_auth_token_v2',
  AUTH_USER: 'nfc_qr_auth_user_v2',
};
```

```typescript
// Source: apps/plateflow-app/src/App.tsx:166-168
const token =
  localStorage.getItem('nfc_qr_auth_token_v2') ||
  localStorage.getItem('plateflow_auth_token');
```

### CORS today (must allowlist)

```typescript
// Source: apps/plateflow-api/src/infrastructure/http/app.ts:31-34
app.register(cors, {
  origin: true,
  credentials: true,
```

Official warning: `origin: true` “is NOT recommended for production as it enables reflection exploits” `[CITED: github.com/fastify/fastify-cors README]`.

### Analytics IP currently mapped onto the DTO

```typescript
// Source: apps/plateflow-api/src/infrastructure/database/DrizzleAnalyticsRepository.ts:38-52
private mapRow(r: typeof analytics.$inferSelect): AnalyticsLog {
  return {
    ip: r.ip || '',
    // timestamp, device, source, ...
  };
}
```

```typescript
// Source: packages/types/src/index.ts:69-82
export interface AnalyticsLog {
  device?: 'iOS (iPhone)' | 'Android' | 'Desktop' | 'Outro';
  ip?: string;
}
```

Strip `ip` in `mapRow`. Stop putting `ip` on JSON sent to the SPA. Dashboard UI already lists placa / dispositivo / data only — keep it that way.

### Public routes that must stay anonymous

```typescript
// Source: apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts:220-221
app.get('/r/:slug', handleRedirect);
app.get('/api/redirects/:slug/resolve', handleRedirect);
```

### GET routes that must gain `requireAuth`

Today only mutations use `preHandler: [requireAuth]`. Add the same preHandler to:

- `GET /` on `plateRoutes` (`/api/plates`)
- `GET /` on `redirectRoutes` (`/api/redirects`)
- `GET /` on `templateRoutes` (`/api/templates`)
- `GET /` on `analyticsRoutes` (`/api/analytics`)

Do not add it to health or public resolve.

### scrypt hasher (must set maxmem)

```javascript
// Source: https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback
// cost/N default 16384; maxmem default 32 * 1024 * 1024;
// error when approximately 128 * N * r > maxmem
const key = crypto.scryptSync(password, salt, 32, {
  N: 131072,
  r: 8,
  p: 1,
  maxmem: 256 * 1024 * 1024,
});
```

Store `scrypt$131072$8$1$<saltB64>$<keyB64>`. Verify with `crypto.timingSafeEqual` on equal-length buffers.

### Fastify inject (auth tests)

```javascript
// Source: https://fastify.dev/docs/v5.5.x/Guides/Testing/
const response = await app.inject({
  method: 'POST',
  url: '/api/auth/login',
  payload: { email, password },
});
// then subsequent inject with cookies: { plateflow_access: '...' }
```

Use `node:test`. `app.close()` in `after`. Set `NODE_ENV=test` so Fastify logger stays off (`logger: process.env.NODE_ENV !== 'test'` in `app.ts:14`).

### Cookie set (HttpOnly, Secure in prod, SameSite Lax)

```javascript
// Source: https://github.com/fastify/fastify-jwt README cookie example (flags);
// sameSite value 'lax' from @fastify/cookie README
reply.setCookie('plateflow_access', accessJwt, {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
  sameSite: 'lax',
});
reply.setCookie('plateflow_refresh', opaque, {
  path: '/api/auth',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
  sameSite: 'lax',
});
```

`sameSite: true` in the JWT README means **Strict**. D-04 locks **Lax** — use the string `'lax'`, not `true`.

### Identity tables (new; names are planner defaults)

```sql
-- custom drizzle migration only — do not CREATE existing tables
CREATE TABLE users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text,
  password_hash text NOT NULL,
  role text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE refresh_sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  token_hash text NOT NULL UNIQUE,
  session_expires_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

`role` values already on `AuthUser`: `'admin' | 'user'` `[VERIFIED: packages/types/src/index.ts:84-89]`. Seed `role = 'admin'`. Do not add `failed_login_count` / `locked_until` (AUTH-04 deferred). Do not add `owner_id` (deferred).

### Header password UI

Reuse `Modal`, `Input`, `Button`, `Card` from `components/ui`. Portuguese copy aligned with LoginScreen (`Acesso ao Painel`, `Credenciais inválidas.`). Account control lives in the existing user chip in `Header.tsx` (logout is currently a `<button title="Encerrar sessão">`). Add “Alterar senha” there; fields: senha atual, nova senha, confirmar. No new route.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prefix `mock_token_admin_*` in `Authorization` | HttpOnly access JWT cookie + opaque refresh cookie | This phase | Forged prefix 401s; XSS cannot read session |
| 8h access JWT, no refresh (older STACK.md) | 15m access + refresh until login+8h | CONTEXT D-03/D-04 | Silent renew; hard shift cap |
| Bearer fallback “for one release” (older SUMMARY.md) | `onlyCookie: true`; no token in JSON | CONTEXT D-01 | Conflicts with SUMMARY — **D-01 wins** |
| `origin: true` | `APP_ORIGIN` allowlist | This phase | Cookie CSRF/theft surface closed |
| Analytics `ip` on JSON | Column stays; DTO omits | This phase | ANLY-04 |
| `packages/database` `migrate` = SELECT + seed | Real `drizzle/` SQL for identity tables | This phase | Repeatable prod apply |
| No test runner | `node:test` + `inject` | This phase | Auth contract tests |

**Deprecated/outdated:**
- `jsonwebtoken` package: `@fastify/jwt` migrated to `fast-jwt` — do not add it.
- Better Auth / Supabase Auth / Argon2: locked out.
- Compiled `admin@plateflow.com` / `plateflow2026`.
- `x-auth-token` header support in `requireAuth`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cookie names `plateflow_access` / `plateflow_refresh` | Standard Stack | Harmless rename; must stay consistent in set/clear/verify |
| A2 | Access TTL 15 minutes | Discretion | Too short: extra refresh chatter. Too long: stolen access lives longer. Still capped at 8h |
| A3 | Refresh cookie `path: '/api/auth'` | Code Examples | If path is wrong, refresh never sent or is sent too widely |
| A4 | Origin header check on mutations is enough CSRF with Lax (no synchronizer token) | CSRF | Residual CSRF on old browsers that ignore SameSite — acceptable for internal tool ASVS L1 |
| A5 | `drizzle-kit generate --custom` exists on kit `^0.31.10` | Pitfall 5 | If flag missing, hand-create `drizzle/` SQL + meta journal |
| A6 | Production fail-closed uses `NODE_ENV === 'production' \|\| VERCEL` | Pattern 3 | Preview deploys without `VERCEL`+prod env might boot open — still require `JWT_SECRET` whenever not `development` if unsure |

**If this table is empty:** n/a — six discretion/tooling assumptions remain.

## Open Questions (RESOLVED)

1. **Drizzle baseline vs custom SQL** — RESOLVED: Custom SQL for `users` + `refresh_sessions` only (01-02). Try `drizzle-kit generate --custom` on kit `^0.31.10`; if the flag is missing, hand-write SQL plus kit journal. Never apply a full-schema CREATE.

2. **Does `/api/auth/me` use `requireAuth` or duplicate jwtVerify?** — RESOLVED: GET `/api/auth/me` uses the same `requireAuth` preHandler as other private routes (01-02). `AuthController.me` does not call `jwtVerify` itself.

3. **PWA installed on the same origin** — RESOLVED: 01-02 greps the app for a service worker; if none is registered, do not add one (no cache bump). If a registration exists, bump that cache so installed PWAs drop Bearer `storageService`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | scrypt, `node:test`, API | ✓ | v24.14.0 (repo types `^22.14.0`) | Stay on scrypt; do not switch to `crypto.argon2` even though it exists on this Node |
| npm | package install | ✓ | 11.9.0 | — |
| pnpm | workspace scripts | ✗ (not on PATH) | `packageManager: pnpm@11.9.0`; corepack 0.34.6 present | `corepack enable` / `corepack prepare pnpm@11.9.0 --activate` |
| `@fastify/jwt` / `@fastify/cookie` | session | not installed yet | install 10.2.2 / 11.1.2 | — |
| PostgreSQL / `DATABASE_URL` | users table, seed | not probed (do not read `.env`) | — | Generate SQL even if apply waits on env |
| `psql` CLI | manual SQL | ✗ | — | drizzle-kit migrate |
| ctx7 / Context7 MCP | docs lookup | ✗ | — | Official GitHub/npm README + Node docs (done) |
| Vitest / Jest | tests | ✗ | — | `node:test` (available) |
| Docker | optional DB | ✓ | 29.7.2 | not required |

**Missing dependencies with no fallback:** none for coding; applying migrations needs a reachable `DATABASE_URL` at execute time.

**Missing dependencies with fallback:** pnpm via corepack; docs via README fetch; tests via `node:test`.

**Note:** This machine’s Node 24 has `crypto.argon2` as a function. CONTEXT still forbids Argon2. Hasher remains scrypt.

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` + Fastify `inject` (no new package) |
| Config file | none — Wave 0: `apps/plateflow-api/package.json` script `"test": "node --import tsx --test src/**/*.test.ts"` (or a single `src/auth/auth.inject.test.ts`) |
| Quick run command | `pnpm --filter @plateflow/api test` |
| Full suite command | same (no other tests exist) |

Do not add Jest. Do not add Vitest this phase (SUS).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Login sets cookies, `/me` 200, logout clears | inject | `node --import tsx --test apps/plateflow-api/src/auth/auth.inject.test.ts` | ❌ Wave 0 |
| AUTH-01 | `Authorization: Bearer mock_token_admin_1` 401 on `GET /api/plates` and `PUT` | inject | same | ❌ Wave 0 |
| AUTH-01 | Missing cookie 401 on `GET /api/plates` | inject | same | ❌ Wave 0 |
| AUTH-03 | Change password then login with new password; old refresh 401 | inject | same | ❌ Wave 0 |
| ANLY-04 | `GET /api/analytics` 401 without cookie; 200 body has no `"ip"` | inject | same | ❌ Wave 0 |
| ANLY-04 | `GET /api/plates` / `/api/templates` / `/api/redirects` 401 without cookie | inject | same | ❌ Wave 0 |
| SHOP-01 | `POST /api/plates/batch` 401 without cookie; 200 with cookie (fixture qty 1) | inject | same | ❌ Wave 0 |
| SCAN safety | `GET /r/:slug` still not 401 (use existing fixture or 404 HTML, not login JSON) | inject | same | ❌ Wave 0 |
| CORS | Reflect foreign origin + credentials must not allowlist `https://evil.example` | inject | same | ❌ Wave 0 |
| AUTH-03 UI | Header account menu Portuguese form | manual-only | — | UI gate; no component runner |

### Sampling Rate

- **Per task commit:** `pnpm --filter @plateflow/api test` plus `pnpm --filter @plateflow/api lint` (`tsc --noEmit`)
- **Per wave merge:** same + `pnpm --filter @plateflow/app lint`
- **Phase gate:** inject suite green; grep `mock_token_admin_` empty; grep `nfc_qr_auth_token_v2` only as a **delete** path; `/r/:slug` not behind jwt

### Wave 0 Gaps

- [ ] `apps/plateflow-api/src/auth/auth.inject.test.ts` — AUTH-01/03, ANLY-04, SHOP-01 persist gate, public `/r/:slug`
- [ ] `apps/plateflow-api/package.json` `test` script using `node --import tsx --test`
- [ ] Test `JWT_SECRET` / admin env fixtures; `NODE_ENV=test`
- [ ] Framework install: **none** — `tsx` already in API `devDependencies`
- [ ] No `tests/conftest.py` / Jest config — N/A

SPA 401-during-ZIP is manual (D-07) unless a unit test stubs `apiFetch` retry; do not block Wave 0 on canvas.

## Security Domain

`security_enforcement` is enabled (ASVS level 1).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | scrypt hasher, seeded `users`, change-password with current password |
| V3 Session Management | yes | HttpOnly cookies, 15m access / 8h ceiling, logout revoke, refresh rotation |
| V4 Access Control | partial | `requireAuth` on admin GETs; **not** object-level ownership (Phase 3) |
| V5 Input Validation | yes | Fastify JSON Schema on login/change-password (email + non-empty password); no Zod |
| V6 Cryptography | yes | `@fastify/jwt` HS256; `crypto.scrypt` + `timingSafeEqual`; never hand-roll JWT |

### Known Threat Patterns for Fastify cookie SPA

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Forgeable prefix token | Elevation of privilege | Delete `mock_token_admin_*`; `onlyCookie` JWT |
| XSS steals Bearer from localStorage | Information disclosure | HttpOnly cookies; JS must not read session |
| CSRF with cookie session | Tampering | `SameSite=Lax` + `APP_ORIGIN` CORS + Origin check on POST/PUT/PATCH/DELETE |
| CORS origin reflection | Information disclosure | Allowlist `APP_ORIGIN`; official README forbids `origin: true` in prod |
| Public inventory/IP dump | Information disclosure | `requireAuth` on GETs; strip `ip` in DTO |
| Refresh reuse after password change | Elevation of privilege | Revoke all `refresh_sessions` for `user_id` (D-06) |
| Global jwtVerify breaks scans | Denial of service (business) | Per-route `preHandler`; public `/r/:slug` |
| Login brute force | Elevation of privilege | Residual — AUTH-04 deferred; do not pretend lockout exists |
| Compiled default password | Elevation of privilege | Remove literals; fail closed without env |

## Sources

### Primary (HIGH confidence)

- In-repo files read this session: `AuthController.ts`, `authMiddleware.ts`, `app.ts`, `authRoutes.ts`, `plateRoutes.ts`, `redirectRoutes.ts`, `templateRoutes.ts`, `analyticsRoutes.ts`, `publicRedirectRoutes.ts:220-221`, `DrizzleAnalyticsRepository.ts`, `storageService.ts`, `LoginScreen.tsx`, `Header.tsx`, `App.tsx`, `BatchGeneratorModal.tsx`, `DashboardOverview.tsx`, `packages/types/src/index.ts`, `packages/database/src/schema/index.ts`, `migrate.ts`, `drizzle.config.ts`, `turbo.json`, `01-CONTEXT.md`
- npm registry + `gsd_run query package-legitimacy check`: `@fastify/jwt@10.2.2` OK, `@fastify/cookie@11.1.2` OK
- Local Node probe: scrypt `N=131072` default maxmem **fails** with `memory limit exceeded`; `maxmem: 256MiB` **OK**
- `@fastify/jwt` README cookie + `onlyCookie`: https://github.com/fastify/fastify-jwt/blob/master/README.md
- `@fastify/cookie` Fastify 5 `>=10.x`: https://github.com/fastify/fastify-cookie
- Node `crypto.scrypt` `maxmem` default `32 * 1024 * 1024`: https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback
- Fastify Testing `inject`: https://fastify.dev/docs/v5.5.x/Guides/Testing/
- `@fastify/cors` README `origin: true` reflection warning: https://github.com/fastify/fastify-cors/blob/main/README.md

### Secondary (MEDIUM confidence)

- OWASP CSRF cheat sheet (SameSite Lax vs cookie-to-header): https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- Drizzle `generate` / `pull --init` / custom migrations: https://orm.drizzle.team/docs/drizzle-kit-generate
- `.planning/research/STACK.md` / `SUMMARY.md` / `PITFALLS.md` (Bearer fallback **superseded** by D-01)

### Tertiary (LOW confidence)

- Context7 MCP/CLI unavailable; docs via WebFetch/WebSearch (webfetch classify-confidence = LOW even `--verified`)
- `drizzle-kit generate --custom` flag on exactly `^0.31.10` not executed this session
- Vitest 5.0.1 legitimacy SUS — unused

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — locked libs + npm legitimacy OK + in-repo Fastify 5
- Architecture: HIGH — live routes/controllers read; cookie/`onlyCookie` from official README
- Pitfalls: HIGH — codebase-confirmed bypass/CORS/IP/cache; scrypt maxmem **probed**

**Research date:** 2026-09-21
**Valid until:** 2026-10-21 (30 days; Fastify plugins stable)

**Graph context:** `.planning/graphs/graph.json` absent — no graphify queries.

**Walking Skeleton (MVP Phase 1):** thinnest E2E is signed cookie login → `/me` → one real `GET /api/plates` (DB read) → LoginScreen/Header still the UI. Expand in later plans: refresh+8h, password change, GET matrix, IP strip, CORS, batch persist cookies, D-07 flag.
