# Phase 1: Identity spine - Context

**Gathered:** 2026-09-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Operators reach the existing console only with a signed session. Inventory and analytics GETs are no longer public; IP never appears in API DTOs or UI. After the auth swap, admin can still manage plate templates and generate print lots. Public `GET /r/:slug` stays unauthenticated.

This phase covers AUTH-01, AUTH-03, ANLY-04, and SHOP-01. It does **not** provision other users, assign ownership slices, harden public HTML, or add campaigns.

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and phase scope
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria (AUTH-01, AUTH-03, ANLY-04, SHOP-01)
- `.planning/REQUIREMENTS.md` — AUTH-01, AUTH-03, ANLY-04, SHOP-01; AUTH-02/OWN-* are Phase 3; AUTH-04/AUTH-05 are v2
- `.planning/PROJECT.md` — internal tool, two roles later, mock token must die, stack freeze

### Research (auth stack and pitfalls)
- `.planning/research/SUMMARY.md` — `@fastify/jwt` + cookie plugin + scrypt; seed admin into `users`; CORS allowlist; no global `jwtVerify`
- `.planning/research/STACK.md` — plugin versions, scrypt parameters, `JWT_SECRET` fail-closed
- `.planning/research/PITFALLS.md` — Pitfall 1 (auth theater / dual keys / cache on `/me` error), Pitfall 7 (CORS + credentials)

### Mapped codebase
- `.planning/codebase/ARCHITECTURE.md` — Route → Controller → UseCase → Repository; auth currently prefix token; GETs public
- `.planning/codebase/CONCERNS.md` — forgeable token, public GETs with IP, default credentials, `verifyAuth` cache
- `.planning/codebase/STACK.md` — `JWT_SECRET` in turbo.json unused; `ADMIN_EMAIL` / `ADMIN_PASSWORD`

### Live code this phase must change
- `apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts` — login/`/me` mock token
- `apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts` — prefix `requireAuth`
- `apps/plateflow-app/src/services/storageService.ts` — Bearer `localStorage`, `verifyAuth` cache-on-error
- `apps/plateflow-app/src/components/LoginScreen.tsx` — keep as the login gate
- `apps/plateflow-app/src/components/Header.tsx` — logout exists; account menu + change-password goes here
- `apps/plateflow-app/src/App.tsx` — auth gate, dual token key read, print-lot orchestration
- `apps/plateflow-app/src/components/BatchGeneratorModal.tsx` — in-flight ZIP must survive 401-until-refresh
- `packages/types/src/index.ts` — `AuthUser` (`id`, `email`, `role`)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LoginScreen` — keep as the unauthenticated gate; reuse `Card` / `Input` / `Button` from `components/ui` for the change-password form in the Header menu
- `Header` — already has user + `onLogout`; add account menu here, do not introduce a client router
- `StorageService` — single place for all `/api/*` calls except the existing batch POST leak in `App.tsx`; move auth to cookie/`credentials` here
- `AuthController` + `authMiddleware` + `authRoutes` — replace in place; keep Fastify plugin composition
- `I*Repository` / use-case class pattern — new `LoginUseCase`, `ChangePasswordUseCase`, `ITokenIssuer`, `IPasswordHasher` live in core; JWT/scrypt stay in infrastructure

### Established Patterns
- Clean Architecture: `core/` must not import Fastify or Drizzle
- SPA: React state in `App.tsx` + `localStorage` cache; server becomes source of truth for session
- Errors: use cases throw Portuguese `Error` messages; controllers return `{ error: string }`
- No test runner yet — first auth tests should follow Fastify `inject` (research); do not add Jest

### Integration Points
- `requireAuth` today only on POST/PUT/DELETE of plates, redirects, templates — extend to GETs of plates, redirects, templates, analytics
- Public surface remains `GET /r/:slug` and resolve; `/api/health` stays unauthenticated
- Print lot: `BatchGeneratorModal` → `App.handleBatchCreated` → `POST /api/plates/batch` must still work for the seeded admin after the auth swap
- `turbo.json` already lists `JWT_SECRET`; start reading it
- CORS in `apps/plateflow-api/src/infrastructure/http/app.ts` (`origin: true`) must be tightened in this phase

</code_context>

<specifics>
## Specific Ideas

- Portuguese console copy stays (login already: “Acesso ao Painel”, “Credenciais inválidas.”).
- User’s security intent: cookie httpOnly **because** the token must not be reachable from JS (XSS on the admin PWA).
- Refresh exists so an operator **does not get kicked mid-navigation**; the 8h cap still ends the shift.
- Batch: “wait for the process to finish after download, then kick if there is no refresh” — with D-03 they have refresh; kick is only the failed-refresh fallback after ZIP completes.

</specifics>

<deferred>
## Deferred Ideas

- **Admin can set any user’s password; a user can only change their own.** Other users do not exist until Phase 3 (AUTH-02 / ownership). Note for Phase 3: admin password-reset of others is **not** the same as create/deactivate — add it when users are provisioned.
- Login rate-limit + persisted lockout (AUTH-04) and forgot-password (AUTH-05) stay v2.
- Forced first-login password change after env seed is v2 (“forced password reset” in research defer list). Optional prompt is not in scope unless it falls out of D-05.
- Unique `plates.slug`, `owner_id` / `assigned_user_id` columns, and user provisioning are not this phase’s success criteria (schema for `users` **is** required for AUTH-03 and the seeded admin).

</deferred>

---

*Phase: 1-Identity spine*
*Context gathered: 2026-09-21*
