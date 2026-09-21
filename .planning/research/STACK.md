# Stack Research

**Domain:** Additive auth, ownership, and LGPD-safe analytics for an existing Fastify 5 + Drizzle/pg + React 19 PWA (internal QR/NFC plate ops, Brazil)
**Researched:** 2026-09-21
**Confidence:** HIGH (Fastify plugin versions and JWT cookie pattern); MEDIUM (password hasher: OWASP prefers Argon2id, this deploy path should use Node `crypto.scrypt`)

This is **not** a greenfield stack. Keep Fastify, React 19, Vite 6, Tailwind 4, Drizzle, `pg`, `qrcode`, Web NFC, Pix/WhatsApp/vCard. Replace the guessable `mock_token_admin_*` Bearer prefix with signed JWT plus a `users` table. Do not introduce a second HTTP framework, ORM, or database.

## Recommended Stack

### Core Technologies

Keep these. Do not replace them in this milestone.

| Technology | Version (repo / latest checked) | Purpose | Why Recommended | Confidence |
|------------|---------------------------------|---------|-----------------|------------|
| Fastify | `^5.2.1` in repo (latest npm `5.12.5`) | HTTP API + public `/r/:slug` | Already the app server; Fastify 5 plugins below target `^5.x`. Stay on 5.x; no Express revival. | HIGH |
| React + react-dom | `^19.0.1` | Admin/user PWA | Already the console. No Next.js rewrite. | HIGH |
| Drizzle ORM | `^0.45.2` in repo (npm `0.45.3`) | Schema + queries | Ownership, campaigns, users, session revoke flags, analytics filters are SQL. Do not add Prisma or `@supabase/supabase-js`. | HIGH |
| `pg` | `^8.23.0` | Postgres driver | Single pool via `@plateflow/database`. Supabase is SQL host only. | HIGH |
| Vite | `^6.2.3` | SPA bundler | Unified `server.ts` already mounts Vite in middleware mode. | HIGH |
| Node.js | 22 (types `^22.14.0`) | Runtime | Built-in `crypto.scrypt`, `crypto.randomUUID`, `crypto.timingSafeEqual`. No extra UUID package. | HIGH |
| pnpm + Turbo | `11.9.0` / `^2.10.12` | Monorepo | Existing workspace. New API deps go on `@plateflow/api`. | HIGH |

### Auth and HTTP hardening (add)

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| `@fastify/jwt` | `^10.2.2` | Sign/verify HS256 JWTs | Official Fastify JWT plugin; internally `fast-jwt`. **v9+ is Fastify 5.** Repo already lists `JWT_SECRET` in `turbo.json` but never uses it. Decorates `request.jwtVerify` / `reply.jwtSign`. Cookie mode still falls back to `Authorization: Bearer`, which matches today’s PWA `fetch` headers. Legitimacy OK (~609k weekly). | HIGH |
| `@fastify/cookie` | `^11.1.2` | HttpOnly auth cookie | Required by `@fastify/jwt` cookie option (`req.cookies`). Register **before** JWT. `>=10.x` is Fastify 5. Same-origin PWA (`/` + `/api/*`) can drop the token out of `localStorage`. Legitimacy OK. | HIGH |
| Node `crypto.scrypt` | Node 22 built-in | Password hashing | OWASP second choice when Argon2id is not safely available. Node 22 **does not** ship `crypto.argon2`. Native `argon2` npm is legitimate but routinely loses `.node` binaries on Vercel/esbuild (this repo bundles API with esbuild and `allowBuilds` does not include argon2). Params: `N=131072` (2^17), `r=8`, `p=1`, 32-byte key, random 16-byte salt, `timingSafeEqual` on verify. Store as `scrypt$N$r$p$saltB64$keyB64`. | MEDIUM |
| `@fastify/helmet` | `^13.1.1` | Security headers | Fastify 5 wrapper (`>=12.x`). Set globally, then `{ helmet: false }` (or disable CSP) on public Pix/vCard HTML routes that use inline styles. Legitimacy OK. | HIGH |
| `@fastify/rate-limit` | `^11.2.0` | Login brute-force throttle | Fastify 5 plugin. In-memory store is **not** shared across Vercel isolates — pair with `users.failed_login_count` / `locked_until` in Postgres so lockout survives cold starts. Legitimacy OK. | HIGH |
| `@fastify/cors` | `^10.0.1` (already present) | CORS | Keep the plugin; **change config**. `origin: true` + `credentials: true` reflects any Origin and is unsafe once cookies exist. Pin to the app origin. | HIGH |

**JWT shape (prescriptive):** HS256 with required `JWT_SECRET` (fail boot if missing; no default). Claims: `sub` (user id), `role` (`admin` \| `user`), `email`. `sign.expiresIn: '8h'` (one shop shift). Cookie name `plateflow_token`, `httpOnly: true`, `secure: true` in production, `sameSite: 'lax'`, `path: '/'`. `requireAuth`: `jwtVerify()` then Drizzle load of `users` by `sub`; reject if missing or `active=false`. That DB check is the revocation mechanism for deactivate/delete — do not add Redis or a JWT denylist in v1.

**Login bootstrap:** Seed the first admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` **once** into `users` with a scrypt hash. After seed, authenticate only against the table. Remove plaintext env compare and the `mock_token_admin_` prefix.

### Database additions (Drizzle, no new ORM)

| Table / column | Purpose | Why |
|----------------|---------|-----|
| `users` | id, email (unique), name, password_hash, role, active, failed_login_count, locked_until, created_at | Admin-provisioned accounts. No public signup table, no OAuth accounts table. |
| `redirects.owner_user_id` + `redirects.assigned_user_id` (nullable) | Custody | User slice = owner **or** assignee. Admin sees all. Enforce in use cases, not UI. |
| `campaigns` + `campaign_redirects` (or `redirects.campaign_id`) | First-class grouping | Do **not** reuse `plates.batch_identifier`. Deleting a campaign must not cascade-delete QRs. |
| `analytics` (existing) | Scans | Keep `ip` in DB if needed for abuse; **omit `ip` from every JSON DTO**. Filter with Drizzle `gte`/`lte` on `timestamp`. |

IDs: `crypto.randomUUID()`. Migrations: existing `drizzle-kit` `^0.31.10` + `pnpm --filter @plateflow/database db:generate`.

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| `qrcode` | `^1.5.4` (already in API + app) | PNG + SVG QR download | `QRCode.toDataURL(url, { width: 1024 })` for PNG; `QRCode.toString(url, { type: 'svg' })` for SVG. Encode `/r/{slug}` only — do not encode the live destination. | HIGH |
| `jszip` | `^3.10.2` (already) | Batch plate ZIP | Admin print lots only. Not for single QR PNG/SVG download. | HIGH |
| Fastify JSON Schema | built-in | Request validation | Login, user create, date-range analytics. Do not add Zod unless a phase explicitly needs shared client/server schemas. | HIGH |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `drizzle-kit` `^0.31.10` | Generate/push migrations for `users`, ownership columns, `campaigns` | Use `db:generate` then `migrate`; do not only `db:push` in production. |
| esbuild (API bundle) | Vercel `api/index.ts` | Existing `--external:@fastify/*` already covers new `@fastify/jwt` / cookie / helmet / rate-limit. Do **not** bundle native addons. |
| `tsx` | Dev server | Unchanged. |
| Vitest (optional later) | Tests | Repo has no runner. If tests are added, use Vitest — not Jest. Not required to ship auth. |

## Installation

```bash
# API only — do not add these to the React app
pnpm --filter @plateflow/api add @fastify/jwt@^10.2.2 @fastify/cookie@^11.1.2 @fastify/helmet@^13.1.1 @fastify/rate-limit@^11.2.0

# Schema work stays in the existing database package
pnpm --filter @plateflow/database db:generate
pnpm --filter @plateflow/database migrate
```

No password-hashing package. No QR package. No analytics vendor SDK.

Env (already named in `turbo.json`; make them required at boot):

- `JWT_SECRET` — min 32 random bytes; used by `@fastify/jwt`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — first-admin seed only
- `DATABASE_URL` — unchanged
- Optional `APP_ORIGIN` — explicit CORS allowlist (e.g. production Vercel URL + `http://localhost:3005`)

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@fastify/jwt` 10.2.2 + cookie | Better Auth `1.7.5` Fastify adapter | Greenfield app that wants OAuth, magic links, and a public `/api/auth/*` catch-all. Here it collides with existing `AuthController`, pulls its own user/session schema, and legitimacy is SUS (`too-new`). Skip. |
| `@fastify/jwt` | `jose` 6.2.12 | Use `jose` only if you leave Fastify or need JWE/JWK rotation across services. Extra wiring; `@fastify/jwt` already wraps `fast-jwt`. |
| `@fastify/jwt` | `@fastify/secure-session` 8.3.0 | Encrypted cookie sessions are fine on a long-lived Node process. Vercel + Fastify `inject()` plus an 8h JWT + `users.active` check is simpler and already anticipated by `JWT_SECRET`. |
| `@fastify/jwt` | `jsonwebtoken` | `@fastify/jwt` migrated off `jsonwebtoken` to `fast-jwt`. Do not add the legacy package. |
| Node `crypto.scrypt` | `argon2` `0.45.1` | Prefer Argon2id **if** you leave Vercel or prove native `prebuilds` ship in the serverless bundle (pnpm `allowBuilds` + esbuild `--external:argon2`). Until then, scrypt is the OWASP-approved path that cannot fail on missing `.node` files. |
| Node `crypto.scrypt` | `hash-wasm` `4.12.0` | Use if a later security review **requires** Argon2id without native addons. WASM cold-start on every Vercel isolate is the cost. Legitimacy OK. |
| First-party analytics table | PostHog / Mixpanel / GA | Would ship scan IP/UA off-box (LGPD sharing). Keep Drizzle `analytics`. |
| Existing UA regex | `ua-parser-js` `2.0.10` | Only if device labels are too coarse. Extra fingerprinting; LGPD minimization says keep iOS/Android/Desktop/Outro. |
| Drizzle filters | `date-fns` | `Date` + Drizzle `gte`/`lte` is enough for date-range analytics. |
| JSON export | `papaparse` / Excel libs | LGPD portability can be `application/json`. CSV is a few `join(',')` lines if operators insist. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `mock_token_admin_*` / prefix checks | Forgable; anyone who guesses the prefix is admin | `@fastify/jwt` + `users` row |
| `@supabase/supabase-js` Auth | Declared in root `package.json`, unused; splits identity from Drizzle/`pg` | Drizzle `users` + JWT |
| Better Auth / Lucia / Passport / `@fastify/passport` | Better Auth is a second auth product (catch-all route, own schema, public-signup defaults). Lucia is not the Fastify-native path. Passport is callback-era and fights Clean Architecture controllers. | `@fastify/jwt` + existing `AuthController` |
| `argon2` / `@node-rs/argon2` **in this deploy** | Native binaries vanish on Vercel file tracing and this API is esbuild-bundled | `crypto.scrypt` |
| `bcrypt` / `bcryptjs` | 72-byte truncation; OWASP treats bcrypt as legacy | `crypto.scrypt` |
| SHA-256 / MD5 “hashing” | Fast hashes are for integrity, not passwords (OWASP) | `crypto.scrypt` |
| Redis session store / `@fastify/session` | No Redis in the repo; serverless isolates do not share memory | JWT + `users.active` |
| Express (`^4.21.2` is declared, unused) | Dual framework | Fastify only |
| `@google/genai` | Declared, unused; out of product | Do not import |
| `react-router` | App has no router today; privacy policy can be a view flag or a static `public/` page | Add a router only if multiple public pages appear |
| CASL / Cerbos / Oso | Two roles (`admin` \| `user`) and a SQL ownership predicate | `if (role !== 'admin') where owner or assigned` |
| OneTrust / Cookiebot / consent SDKs | v1 explicitly skips scan-time consent; `/r/:slug` must not be gated | Static privacy policy + export/delete |
| New QR libs (`qrcode.react`, `uqr`, `nayuki`) | `qrcode` already does PNG and SVG on server and client | Existing `qrcode` |
| iOS NFC polyfills / native wrappers | Web NFC is Chrome/Android only; v1 constraint | Keep `NDEFReader`; document iOS as out of scope |

## Stack Patterns by Variant

**If production stays on Vercel serverless (current):**
- Use `@fastify/jwt` (stateless) + cookie + Bearer fallback.
- Hash passwords with `crypto.scrypt`.
- Revoke access by setting `users.active = false` (checked after `jwtVerify`).
- Do not depend on in-memory rate-limit alone; persist lockout on `users`.
- Because `esbuild` already externals `@fastify/*`, new plugins load from `node_modules` at runtime.

**If you later run a long-lived Node host (`tsx server.ts` only):**
- `argon2` 0.45.1 becomes reasonable (OWASP first choice). Rehash on login via a version prefix (`scrypt$` vs `argon2id$`).
- In-memory `@fastify/rate-limit` becomes trustworthy.

**If the product becomes public SaaS with self-serve signup:**
- Revisit Better Auth (or similar) then — not now. v1 is admin-provisioned only.

**Frontend token migration:**
1. Login sets HttpOnly cookie **and** may still return `{ token, user }` for one release.
2. All `fetch` calls use `credentials: 'include'`.
3. Stop writing `nfc_qr_auth_token_v2` to `localStorage`. Keep a non-secret `user` object in memory for UI role gates.
4. Server remains the authority; UI hide is not authorization.

**Public vs authenticated routes:**
- Public: `GET /r/:slug` (and Pix/vCard HTML), privacy policy, login.
- Auth required: every inventory GET/POST/PATCH/DELETE, analytics, QR PNG/SVG download, NFC `nfcWritten`, user provisioning.
- IP may be written in `analytics.ip`; strip it in the repository mapper so it never reaches the React tree.

**LGPD operational (no extra product):**
- Privacy policy: static React view or `apps/plateflow-app/public/privacidade.html` — controller identity, what is stored on scan (timestamp, device, source, IP stored not shown), legitimate interest for ops metrics, how to request export/delete.
- Export: `GET /api/privacy/export` → JSON of account + scan rows **without IP**.
- Delete: `DELETE /api/privacy/scans` (scope-limited) and admin `DELETE /api/users/:id` (deactivate, revoke by `active=false`, optional scan wipe).
- Do not add a DSR ticket SaaS.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@fastify/jwt` `>=9` / `10.2.2` | Fastify `^5` | Official README compatibility table. Repo Fastify `^5.2.1` is in range. |
| `@fastify/cookie` `>=10` / `11.1.2` | Fastify `^5` | Register cookie plugin before JWT cookie mode. |
| `@fastify/helmet` `>=12` / `13.1.1` | Fastify `^5` | Helmet 8 underneath. |
| `@fastify/rate-limit` `11.2.0` | Fastify `^5` | Dev dep of `@fastify/jwt` is `^11.0.0`. |
| `@fastify/cors` `^10.0.1` | Fastify `^5` | Already installed. Tighten `origin` when cookies ship. |
| `drizzle-orm` `^0.45.2` | `pg` `^8.23.0`, `drizzle-kit` `^0.31.10` | Stay; 0.45.3 is a patch, not required for this milestone. |
| `qrcode` `1.5.4` | Node 22, browser | `toString` types: `svg` \| `utf8` \| `terminal`. |
| `react` `^19.0.1` | Vite 6, `@vitejs/plugin-react` `^5.0.4` | Unchanged. |
| Better Auth `1.7.5` | Fastify via Fetch adapter; peer includes `drizzle-orm` `^0.45.2` | Compatible on paper; **do not adopt**. |
| Node 22 | `crypto.scrypt` yes; `crypto.argon2` **no** (not in Node 22 docs) | Hasher choice follows this. |

## Sources

- npm registry versions (2026-09-21): `@fastify/jwt@10.2.2`, `@fastify/cookie@11.1.2`, `@fastify/helmet@13.1.1`, `@fastify/rate-limit@11.2.0`, `argon2@0.45.1`, `hash-wasm@4.12.0`, `better-auth@1.7.5`, `qrcode@1.5.4`, `drizzle-orm@0.45.3`, `fastify@5.12.5` — legitimacy OK for jwt/cookie/helmet/rate-limit/argon2/hash-wasm/qrcode; Better Auth SUS (`too-new`)
- `@fastify/jwt` README — Fastify 5 = v9+, cookie + Bearer fallback, `httpOnly`/`secure`/`sameSite`: https://www.npmjs.com/package/@fastify/jwt and https://github.com/fastify/fastify-jwt — confidence HIGH (websearch + legitimacy OK)
- `@fastify/cookie` README — Fastify 5 = `>=10.x`, httpOnly notes: https://www.npmjs.com/package/@fastify/cookie — confidence MEDIUM (webfetch seam; contents match npm)
- `@fastify/helmet` README — Fastify 5 = `>=12.x`: https://www.npmjs.com/package/@fastify/helmet — confidence HIGH (legitimacy OK + official README)
- Better Auth Fastify integration (catch-all `/api/auth/*`): https://better-auth.com/docs/integrations/fastify — confidence MEDIUM
- OWASP Password Storage Cheat Sheet — Argon2id first, scrypt fallback `N=2^17`, `r=8`, `p=1`; bcrypt legacy: https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Password_Storage_Cheat_Sheet.md — confidence MEDIUM (websearch verified against cheat sheet extracts)
- Node.js 22 `crypto.scrypt` API (no argon2 in this version’s crypto docs): https://nodejs.org/docs/latest-v22.x/api/crypto.html — confidence MEDIUM (webfetch)
- `argon2` on Vercel missing native prebuilds: https://github.com/vercel/next.js/discussions/65978 — confidence MEDIUM (community, consistent across issues)
- `qrcode` `toDataURL` / `toString({ type: 'svg' })`: https://www.npmjs.com/package/qrcode — confidence HIGH (legitimacy OK)
- LGPD Lei nº 13.709/2018 Arts. 9, 18: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm — confidence MEDIUM (official text; operational mapping is ours)
- ANPD titular rights: https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares — confidence MEDIUM
- Existing repo map (2026-09-20): `.planning/codebase/STACK.md`, `AuthController.ts`, `authMiddleware.ts`, `packages/database/src/schema/index.ts`

### Gaps

- classify-confidence seam: Context7 MCP/CLI unavailable in this runtime; docs came from npm/GitHub/Node (webfetch = LOW unless legitimacy OK). Versions were cross-checked with `npm view` the same day.
- Node.js may add built-in Argon2 in a later major; re-check before adding the `argon2` package.
- `@fastify/rate-limit` latest store options on Vercel were not load-tested here; persist lockout on `users` regardless.

---
*Stack research for: PlateFlow subsequent milestone (signed sessions, ownership, LGPD-safe analytics)*
*Researched: 2026-09-21*
