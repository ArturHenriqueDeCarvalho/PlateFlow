---
phase: 01-identity-spine
reviewed: 2026-09-21T19:25:00Z
depth: standard
files_reviewed: 36
files_reviewed_list:
  - apps/plateflow-api/src/auth/auth.inject.test.ts
  - apps/plateflow-api/package.json
  - apps/plateflow-api/src/core/ports/IPasswordHasher.ts
  - apps/plateflow-api/src/core/ports/ITokenIssuer.ts
  - apps/plateflow-api/src/core/repositories/IRefreshSessionRepository.ts
  - apps/plateflow-api/src/core/repositories/IUserRepository.ts
  - apps/plateflow-api/src/core/use-cases/auth/ChangePasswordUseCase.ts
  - apps/plateflow-api/src/core/use-cases/auth/LoginUseCase.ts
  - apps/plateflow-api/src/core/use-cases/auth/LogoutUseCase.ts
  - apps/plateflow-api/src/core/use-cases/auth/RefreshSessionUseCase.ts
  - apps/plateflow-api/src/infrastructure/auth/FastifyTokenIssuer.ts
  - apps/plateflow-api/src/infrastructure/auth/fastifyJwt.d.ts
  - apps/plateflow-api/src/infrastructure/auth/seedAdminUser.ts
  - apps/plateflow-api/src/infrastructure/auth/sessionCookies.ts
  - apps/plateflow-api/src/infrastructure/crypto/ScryptPasswordHasher.ts
  - apps/plateflow-api/src/infrastructure/database/DrizzleAnalyticsRepository.ts
  - apps/plateflow-api/src/infrastructure/database/DrizzleRefreshSessionRepository.ts
  - apps/plateflow-api/src/infrastructure/database/DrizzleUserRepository.ts
  - apps/plateflow-api/src/infrastructure/http/app.ts
  - apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts
  - apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts
  - apps/plateflow-api/src/infrastructure/http/middleware/requireOrigin.ts
  - apps/plateflow-api/src/infrastructure/http/routes/analyticsRoutes.ts
  - apps/plateflow-api/src/infrastructure/http/routes/authRoutes.ts
  - apps/plateflow-api/src/infrastructure/http/routes/plateRoutes.ts
  - apps/plateflow-api/src/infrastructure/http/routes/redirectRoutes.ts
  - apps/plateflow-api/src/infrastructure/http/routes/templateRoutes.ts
  - apps/plateflow-app/src/App.tsx
  - apps/plateflow-app/src/components/BatchGeneratorModal.tsx
  - apps/plateflow-app/src/components/Header.tsx
  - apps/plateflow-app/src/components/LoginScreen.tsx
  - apps/plateflow-app/src/services/storageService.ts
  - packages/database/drizzle/0000_add-identity-tables.sql
  - packages/database/src/migrate.ts
  - packages/database/src/schema/index.ts
  - packages/types/src/index.ts
findings:
  critical: 1
  warning: 6
  info: 3
  total: 10
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-09-21T19:25:00Z
**Depth:** standard
**Files Reviewed:** 36
**Status:** issues_found

## Summary

Phase 1 replaced mock Bearer auth with HttpOnly cookie sessions, refresh rotation, Origin CSRF on mutations, inventory `requireAuth`, analytics IP omission on GET, change-password, and SPA silent refresh / D-07 batch deferral. The core cookie + scrypt + sid-bound revoke design is sound and covered by inject contracts. Adversarial review found one critical client race around print-lot persist vs session teardown, plus several session/security hardening gaps.

## Critical Issues

### CR-01: Print-lot persist races D-07 session teardown

**File:** `apps/plateflow-app/src/components/BatchGeneratorModal.tsx:120-125`
**File:** `apps/plateflow-app/src/App.tsx:143-148`
**Issue:** `onBatchCreated` is fire-and-forget (not awaited). The modal’s `finally` sets `isProcessing = false` immediately after *starting* persist, which clears `batchInFlight`. If refresh already failed during ZIP (`pendingLogout`), App then `setUser(null)` while `StorageService.persistBatch` may still be in flight. When `!user`, App returns only `LoginScreen` — the toast path is unmounted — so a failed server persist is easy to miss, and cookies may already be cleared so the lot never lands in Postgres while the operator only has a local ZIP.
**Fix:** Keep processing true until persist finishes; await the batch callback; on deferred logout, revoke/clear session explicitly:

```tsx
// BatchGeneratorModal.tsx
try {
  // ... ZIP ...
  setDownloadReady({ url: downloadUrl, filename, count: quantity });
  await Promise.resolve(onBatchCreated(newPlates, newRedirects));
} finally {
  setIsProcessing(false);
}

// App.tsx — widen the prop type to Promise-capable
onBatchCreated={async (plates, redirects) => {
  await handleBatchCreated(plates, redirects);
}}

// Deferred logout must clear cache + revoke, not only setUser(null):
useEffect(() => {
  if (!batchInFlight && pendingLogout) {
    setPendingLogout(false);
    void StorageService.logout().then(() => setUser(null));
  }
}, [batchInFlight, pendingLogout]);
```

## Warnings

### WR-01: Deferred D-07 logout skips cache clear and revoke

**File:** `apps/plateflow-app/src/services/storageService.ts:69-76`
**File:** `apps/plateflow-app/src/App.tsx:143-148`
**Issue:** When `batchInFlight` is true, `notifySessionDead` / `clearSessionUnlessBatchInFlight` only call `onPendingLogout` and return — they do not `clearAuthUserCache()` or `POST /api/auth/logout`. After ZIP, App only `setUser(null)`. If refresh failed due to a network error (not a 401 that cleared cookies), the refresh cookie remains valid: a reload can silently restore the session via `/refresh`, contradicting the LoginScreen the operator just saw. `AUTH_USER` also stays in `localStorage` until a later path clears it.
**Fix:** On pending-logout flush, always call `StorageService.logout()` (best-effort revoke + clear cache), then `setUser(null)`.

### WR-02: Refresh token reuse does not kill the session family

**File:** `apps/plateflow-api/src/core/use-cases/auth/RefreshSessionUseCase.ts:26-39`
**Issue:** After rotation, presenting the previous opaque refresh returns 401 (`findByTokenHash` miss) but does **not** revoke the current session row. A stolen rotated token remains valid if the victim later retries the old cookie (or an attacker wins a concurrent refresh race). Inject only asserts stale → 401, not family revoke.
**Fix:** On unknown/mismatched hash for a presented cookie that looks like a prior rotation, revoke by `sid` if recoverable, or store `previous_token_hash` and on reuse call `revokeById` / `revokeAllForUser`:

```ts
const session = await this.refreshSessionRepo.findByTokenHash(tokenHash);
if (!session) {
  // optional: detect reuse via previous_hash column, then revokeAllForUser
  throw new Error(SESSION_INVALID);
}
```

### WR-03: Login short-circuits before password verify (timing oracle)

**File:** `apps/plateflow-api/src/core/use-cases/auth/LoginUseCase.ts:25-33`
**Issue:** Missing/inactive users return before `passwordHasher.verify`, while wrong-password users pay full scrypt cost. Same error string does not remove the timing signal for email enumeration on an internal console still exposed on a network.
**Fix:** Always run verify against a dummy scrypt hash when the user is missing/inactive:

```ts
const user = await this.userRepo.findByEmail(email.trim().toLowerCase());
const hash = user?.passwordHash ?? DUMMY_SCRYPT_HASH;
const ok = await this.passwordHasher.verify(password, hash);
if (!user || !user.active || !ok) {
  throw new Error(INVALID_CREDENTIALS);
}
```

### WR-04: `requireAuth` allows access JWTs without `sid`

**File:** `apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts:24-30`
**Issue:** Session revoke/expiry is checked only `if (sid)`. Issuers always set `sid` today, but any access token missing `sid` (mis-issue, older token shape, or crafted JWT with a compromised secret) skips logout binding and remains valid until `exp`. Logout’s effectiveness depends on this field being mandatory.
**Fix:** Reject missing `sid`:

```ts
const sid = req.user?.sid;
if (!sid) {
  return reply.status(401).send(UNAUTHORIZED);
}
const session = await refreshRepo.findById(sid);
if (!session || session.revokedAt || new Date() >= session.sessionExpiresAt) {
  return reply.status(401).send(UNAUTHORIZED);
}
```

### WR-05: Auth controllers return raw `err.message` to clients

**File:** `apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts:46-48`
**File:** `apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts:138-146`
**Issue:** Login maps any thrown error to `401` with `err.message`. Change-password maps unexpected errors to `500` with `err.message`. A DB/driver failure can leak internal details in the JSON body.
**Fix:** Map known domain messages only; otherwise send fixed Portuguese copy and log the real error server-side:

```ts
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : '';
  if (message === INVALID_CREDENTIALS) {
    return reply.status(401).send({ error: message });
  }
  req.log.error(err);
  return reply.status(401).send({ error: 'Credenciais inválidas.' });
}
```

### WR-06: Unknown DB `role` values map to `admin`

**File:** `apps/plateflow-api/src/infrastructure/database/DrizzleUserRepository.ts:45`
**Issue:** `role: r.role === 'user' ? 'user' : 'admin'` is fail-open: any typo or unexpected value (`"Admin"`, `"operator"`, `null`-coerced string) becomes admin in JWT claims and `/me`. Phase 1 does not yet gate routes by role, but this becomes privilege escalation as soon as owner-scoped routes land.
**Fix:** Allowlist and fail closed:

```ts
role: r.role === 'admin' || r.role === 'user' ? r.role : (() => { throw new Error('Invalid role'); })(),
```

Or treat unknown as inactive / reject login.

## Info

### IN-01: Change-password accepts single-character new passwords

**File:** `apps/plateflow-api/src/infrastructure/http/routes/authRoutes.ts:23-30`
**Issue:** Schema only enforces `minLength: 1`; use case trims but does not enforce strength. Acceptable for a locked-down internal MVP, but weak against shared/compromised operator machines.
**Fix:** Add a minimum length (e.g. 10) in schema + use case validation.

### IN-02: `seedAdminUser` never updates an existing admin password

**File:** `apps/plateflow-api/src/infrastructure/auth/seedAdminUser.ts:33-43`
**Issue:** `onConflictDoNothing` means rotating `ADMIN_PASSWORD` in env does not update `password_hash`. Operators may believe env rotation revoked the old password.
**Fix:** Document clearly, or provide an explicit one-shot rotate path; do not silently hash-and-discard on every boot.

### IN-03: `requireOrigin` allows requests with no `Origin` header

**File:** `apps/plateflow-api/src/infrastructure/http/middleware/requireOrigin.ts:19-22`
**Issue:** Missing/empty `Origin` skips the allowlist. Intentionally pairs with `SameSite=Lax` for non-browser clients; documented CSRF model is sound for modern browsers. Note for future strict mode if cookie SameSite ever loosens.
**Fix:** None required for v1; optionally require Origin in production when `Sec-Fetch-Site` indicates a browser.

---

_Reviewed: 2026-09-21T19:25:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
