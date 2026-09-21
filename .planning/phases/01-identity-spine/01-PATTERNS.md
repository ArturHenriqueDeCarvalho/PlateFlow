# Phase 1: Identity spine - Pattern Map

**Mapped:** 2026-09-21
**Files analyzed:** 39
**Analogs found:** 35 / 39

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/database/src/schema/index.ts` | model | CRUD | `packages/database/src/schema/index.ts` | exact |
| `packages/database/drizzle/*_add-identity-tables.sql` | migration | file-I/O | — | none |
| `packages/database/src/migrate.ts` | config | file-I/O | `packages/database/src/migrate.ts` | exact |
| `packages/database/src/client.ts` (admin seed) | service | CRUD | `packages/database/src/client.ts` `seedDefaultTemplates` | exact |
| `packages/database/package.json` | config | — | `packages/database/package.json` | exact |
| `packages/types/src/index.ts` | model | transform | `packages/types/src/index.ts` | exact |
| `apps/plateflow-api/src/core/repositories/IUserRepository.ts` | model | CRUD | `apps/plateflow-api/src/core/repositories/ITemplateRepository.ts` | exact |
| `apps/plateflow-api/src/core/repositories/IRefreshSessionRepository.ts` | model | CRUD | `apps/plateflow-api/src/core/repositories/IPlateRepository.ts` | role-match |
| `apps/plateflow-api/src/core/ports/IPasswordHasher.ts` | utility | transform | — | none |
| `apps/plateflow-api/src/core/ports/ITokenIssuer.ts` | utility | transform | — | none |
| `apps/plateflow-api/src/core/use-cases/auth/LoginUseCase.ts` | service | request-response | `apps/plateflow-api/src/core/use-cases/templates/CreateTemplateUseCase.ts` | role-match |
| `apps/plateflow-api/src/core/use-cases/auth/ChangePasswordUseCase.ts` | service | request-response | `apps/plateflow-api/src/core/use-cases/redirects/UpdateRedirectUseCase.ts` | exact |
| `apps/plateflow-api/src/core/use-cases/auth/RefreshSessionUseCase.ts` | service | request-response | `apps/plateflow-api/src/core/use-cases/plates/UpdatePlateUseCase.ts` | role-match |
| `apps/plateflow-api/src/core/use-cases/auth/LogoutUseCase.ts` | service | request-response | `apps/plateflow-api/src/core/use-cases/plates/UpdatePlateUseCase.ts` | role-match |
| `apps/plateflow-api/src/infrastructure/crypto/ScryptPasswordHasher.ts` | utility | transform | `apps/plateflow-api/src/infrastructure/services/PixCodeService.ts` | role-match |
| `apps/plateflow-api/src/infrastructure/auth/FastifyTokenIssuer.ts` | service | transform | — | none |
| `apps/plateflow-api/src/infrastructure/database/DrizzleUserRepository.ts` | service | CRUD | `apps/plateflow-api/src/infrastructure/database/DrizzlePlateRepository.ts` | exact |
| `apps/plateflow-api/src/infrastructure/database/DrizzleRefreshSessionRepository.ts` | service | CRUD | `apps/plateflow-api/src/infrastructure/database/DrizzlePlateRepository.ts` | exact |
| `apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts` | middleware | request-response | `apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts` | exact |
| `apps/plateflow-api/src/infrastructure/http/middleware/requireOrigin.ts` | middleware | request-response | `apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts` | role-match |
| `apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts` | controller | request-response | `apps/plateflow-api/src/infrastructure/http/controllers/PlateController.ts` | exact |
| `apps/plateflow-api/src/infrastructure/http/routes/authRoutes.ts` | route | request-response | `apps/plateflow-api/src/infrastructure/http/routes/plateRoutes.ts` | exact |
| `apps/plateflow-api/src/infrastructure/http/app.ts` | config | request-response | `apps/plateflow-api/src/infrastructure/http/app.ts` | exact |
| `apps/plateflow-api/src/infrastructure/http/routes/plateRoutes.ts` | route | request-response | `apps/plateflow-api/src/infrastructure/http/routes/plateRoutes.ts` | exact |
| `apps/plateflow-api/src/infrastructure/http/routes/redirectRoutes.ts` | route | request-response | `apps/plateflow-api/src/infrastructure/http/routes/plateRoutes.ts` | exact |
| `apps/plateflow-api/src/infrastructure/http/routes/templateRoutes.ts` | route | request-response | `apps/plateflow-api/src/infrastructure/http/routes/templateRoutes.ts` | exact |
| `apps/plateflow-api/src/infrastructure/http/routes/analyticsRoutes.ts` | route | request-response | `apps/plateflow-api/src/infrastructure/http/routes/plateRoutes.ts` | exact |
| `apps/plateflow-api/src/infrastructure/database/DrizzleAnalyticsRepository.ts` | service | transform | `apps/plateflow-api/src/infrastructure/database/DrizzleAnalyticsRepository.ts` | exact |
| `apps/plateflow-api/src/core/use-cases/redirects/ResolveRedirectUseCase.ts` | service | event-driven | `apps/plateflow-api/src/core/use-cases/redirects/ResolveRedirectUseCase.ts` | exact (keep IP write) |
| `apps/plateflow-api/src/auth/auth.inject.test.ts` | test | request-response | `apps/plateflow-api/src/server.ts` (`app.inject`) | role-match |
| `apps/plateflow-api/package.json` | config | — | `apps/plateflow-api/package.json` | exact |
| `apps/plateflow-app/src/services/storageService.ts` | service | request-response | `apps/plateflow-app/src/services/storageService.ts` | exact |
| `apps/plateflow-app/src/components/Header.tsx` | component | request-response | `apps/plateflow-app/src/components/Header.tsx` + `LoginScreen.tsx` + `ui/Modal.tsx` | exact |
| `apps/plateflow-app/src/components/LoginScreen.tsx` | component | request-response | `apps/plateflow-app/src/components/LoginScreen.tsx` | exact |
| `apps/plateflow-app/src/App.tsx` | component | request-response | `apps/plateflow-app/src/App.tsx` | exact |
| `apps/plateflow-app/src/components/BatchGeneratorModal.tsx` | component | file-I/O | `apps/plateflow-app/src/components/BatchGeneratorModal.tsx` | exact |
| `apps/plateflow-app/src/components/DashboardOverview.tsx` | component | request-response | `apps/plateflow-app/src/components/DashboardOverview.tsx` | exact (do not add IP) |
| `.env.example` | config | — | `.env.example` | exact |
| `turbo.json` | config | — | `turbo.json` | exact |

---

## Pattern Assignments

### `packages/database/src/schema/index.ts` (model, CRUD)

**Analog:** same file — add `users` and `refresh_sessions` next to existing `pgTable` blocks. Do not recreate `templates` / `plates` / `redirects` / `analytics`.

**Imports pattern** (lines 1-2):
```typescript
import { pgTable, text, numeric, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import type { DynamicRedirectMetadata } from '@plateflow/types';
```

**Core table pattern** — copy `plates` (lines 44-54) for `users` (text PK, unique email, boolean `active`, timestamptz defaults). Copy `redirects.slug` unique (line 31) for `users.email` unique and `refresh_sessions.token_hash` unique. Copy FK style from `redirects.plate_id` (line 32) as `refresh_sessions.user_id` referencing `users.id`.

```typescript
export const plates = pgTable('plates', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(),
  nfc_written: boolean('nfc_written').default(false).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

**Export types** (lines 69-76): add `UserSelect` / `UserInsert` / `RefreshSessionSelect` the same `$inferSelect` / `$inferInsert` way.

Keep `analytics.ip` column (line 65). ANLY-04 strips IP in the API mapper, not in schema.

---

### `packages/database/drizzle/*_add-identity-tables.sql` (migration, file-I/O)

**Analog:** none — `packages/database/drizzle/` does not exist. `drizzle.config.ts` already points `out: './drizzle'` (lines 4-6). Generate **custom SQL for new tables only** (RESEARCH Pitfall 5). Do not emit `CREATE TABLE templates`.

---

### `packages/database/src/migrate.ts` (config, file-I/O)

**Analog:** same file. Today it only SELECTs and seeds (lines 8-21); it does **not** apply SQL. Replace the SELECT-only body with `drizzle-kit migrate` / `migrate({ migrationsFolder: './drizzle' })` per RESEARCH, then keep calling `seedDefaultTemplates()` after apply.

**Error handling** (lines 23-26): keep `sanitizeErrorMessage` + `process.exit(1)`.

**Self-invoke guard** (lines 29-31): keep `if (process.argv[1]?.includes('migrate'))`.

---

### `packages/database/src/client.ts` — admin seed (service, CRUD)

**Analog:** `seedDefaultTemplates()` in the same file (lines 64-148).

**Core seed pattern** (lines 110-148): Drizzle `insert().values([...]).onConflictDoNothing()`. Copy this for the admin user so later boots cannot overwrite AUTH-03 passwords.

```typescript
await db
  .insert(schema.templates)
  .values([/* ... */])
  .onConflictDoNothing();
```

**Error handling** (lines 149-151): `catch` logs via `sanitizeErrorMessage`; do not crash the isolate on seed warning. Production fail-closed for missing `JWT_SECRET` / admin env lives in `createFastifyApp()`, not here.

**Wiring analog:** `apps/plateflow-api/src/infrastructure/http/app.ts` lines 57-62 already background-seeds templates when `DATABASE_URL` is set — hang `seedAdminUser()` next to that, same `.catch` + `console.warn` shape.

---

### `apps/plateflow-api/src/core/repositories/IUserRepository.ts` (model, CRUD)

**Analog:** `apps/plateflow-api/src/core/repositories/ITemplateRepository.ts` (entire file).

**Imports + interface:**
```typescript
import type { PlateTemplate } from '../entities/index.js';

export interface ITemplateRepository {
  findAll(): Promise<PlateTemplate[]>;
  findById(id: string): Promise<PlateTemplate | null>;
  create(template: PlateTemplate): Promise<PlateTemplate>;
  delete(id: string): Promise<boolean>;
}
```

For users: `findById`, `findByEmail`, `create`, `updatePasswordHash`. Import `AuthUser` from `../entities/index.js` (re-export of `@plateflow/types`, lines 1-11 of `core/entities/index.ts`). Do **not** put `password_hash` on `AuthUser` — keep a core `UserRecord` type next to the port if needed.

---

### `apps/plateflow-api/src/core/repositories/IRefreshSessionRepository.ts` (model, CRUD)

**Analog:** `apps/plateflow-api/src/core/repositories/IPlateRepository.ts` (find + createBatch + deleteBatch).

```typescript
export interface IPlateRepository {
  findById(id: string): Promise<PhysicalPlate | null>;
  createBatch(plates: PhysicalPlate[]): Promise<PhysicalPlate[]>;
  delete(id: string): Promise<boolean>;
  deleteBatch(ids: string[]): Promise<boolean>;
}
```

Map to: `create`, `findByTokenHash`, `revokeById`, `revokeAllForUser(userId)` (D-06). Same file location and `.js` import extensions.

---

### `apps/plateflow-api/src/core/use-cases/auth/LoginUseCase.ts` (service, request-response)

**Analog:** `apps/plateflow-api/src/core/use-cases/templates/CreateTemplateUseCase.ts`.

**Imports / constructor DI** (lines 1-6):
```typescript
import type { ITemplateRepository } from '../../repositories/ITemplateRepository.js';
import type { PlateTemplate } from '../../entities/index.js';

export class CreateTemplateUseCase {
  constructor(private templateRepo: ITemplateRepository) {}
```

**Validation + Portuguese Error** (lines 7-9):
```typescript
if (!templateData.name || !templateData.backgroundUrl) {
  throw new Error('Nome e backgroundUrl são obrigatórios.');
}
```

Login: inject `IUserRepository` + `IPasswordHasher` + `IRefreshSessionRepository` (not Fastify). Throw `new Error('Credenciais inválidas.')` to match `AuthController.ts` line 21 and `LoginScreen.tsx` line 34. Core must not import Fastify or Drizzle.

---

### `apps/plateflow-api/src/core/use-cases/auth/ChangePasswordUseCase.ts` (service, request-response)

**Analog:** `apps/plateflow-api/src/core/use-cases/redirects/UpdateRedirectUseCase.ts`.

**Find-or-throw + mutate** (lines 7-22):
```typescript
async execute(slug: string, updates: Partial<DynamicRedirect>): Promise<DynamicRedirect> {
  const existing = await this.redirectRepo.findBySlug(slug);
  if (!existing) {
    throw new Error(`Redirecionamento com slug "${slug}" não encontrado.`);
  }
  const updated = await this.redirectRepo.update(slug, { ...updates, updatedAt: new Date().toISOString() });
  if (!updated) {
    throw new Error(`Falha ao atualizar redirecionamento com slug "${slug}".`);
  }
  return updated;
}
```

Change-password: load user by `req.user.sub`, verify current hash, write new hash, `revokeAllForUser`. Portuguese for wrong current password: **Senha atual incorreta.** (UI-SPEC). Do not throw Fastify HTTP errors from the use case — controller maps them.

**Also copy** `UpdatePlateUseCase.ts` lines 8-11 for the not-found shape.

---

### `apps/plateflow-api/src/core/use-cases/auth/RefreshSessionUseCase.ts` / `LogoutUseCase.ts` (service, request-response)

**Analog:** `apps/plateflow-api/src/core/use-cases/plates/UpdatePlateUseCase.ts` — constructor-injected repo, `execute()`, Portuguese `Error`.

Refresh looks up opaque hash, checks `revoked_at` / `session_expires_at`, rotates. Logout revokes the current row (or all). No Fastify in core; cookie set/clear stays in `AuthController`.

---

### `apps/plateflow-api/src/infrastructure/crypto/ScryptPasswordHasher.ts` (utility, transform)

**Analog (layout only):** `apps/plateflow-api/src/infrastructure/services/PixCodeService.ts` — a Fastify-free infrastructure module exporting a function (lines 1-7). New hasher should be a **class implementing `IPasswordHasher`**, not a free function, so use cases can DI it.

**Crypto parameters:** no in-repo analog. Copy RESEARCH scrypt snippet: `N: 131072`, `r: 8`, `p: 1`, `maxmem: 256 * 1024 * 1024`, store `scrypt$131072$8$1$<saltB64>$<keyB64>`, verify with `crypto.timingSafeEqual`.

---

### `apps/plateflow-api/src/infrastructure/database/DrizzleUserRepository.ts` / `DrizzleRefreshSessionRepository.ts` (service, CRUD)

**Analog:** `apps/plateflow-api/src/infrastructure/database/DrizzlePlateRepository.ts`.

**Imports** (lines 1-3):
```typescript
import { db, plates, eq, desc, sql, inArray } from '@plateflow/database';
import type { IPlateRepository } from '../../core/repositories/IPlateRepository.js';
import type { PhysicalPlate } from '../../core/entities/index.js';
```

**findById + null** (lines 20-23): `select().from(...).where(eq(...)).limit(1)` then `if (!rows.length) return null`.

**create / conflict** (lines 81-94): `insert().values().onConflictDoUpdate` — for admin seed use `onConflictDoNothing` like `client.ts` 148, not update (would undo AUTH-03).

**update** (lines 107-116): `db.update(plates).set(patch).where(eq(plates.id, id)).returning()`.

**deleteBatch** (lines 135-138): `inArray` — copy for `revokeAllForUser`.

**mapRow:** copy `DrizzleAnalyticsRepository.mapRow` (lines 38-52) as a private mapper so DTO fields stay camelCase.

---

### `apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts` (middleware, request-response)

**Analog:** same file (replace the prefix check). Keep the export name `requireAuth` and the Portuguese `{ error }` 401 (lines 7-10) so every route that already uses `preHandler: [requireAuth]` keeps compiling.

**Current (must die in the same change)** (lines 3-12):
```typescript
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const token = authHeader?.replace(/^Bearer\s+/i, '') || (req.headers['x-auth-token'] as string);
  if (!token || !token.startsWith('mock_token_admin_')) {
    return reply.status(401).send({
      error: 'Não autorizado. Faça login como administrador para realizar alterações.',
    });
  }
}
```

**Replacement:** `await req.jwtVerify({ onlyCookie: true })`, load user by `sub`, 401 if missing/`active === false`. **Never** register this as a global `onRequest` (would 401 `GET /r/:slug`).

**Origin-check middleware** (new): same signature `async (req, reply) => { ... return reply.status(403).send({ error: '...' }) }`. Apply only to POST/PUT/PATCH/DELETE. Analog is this file’s early-return 401 shape, not a new error class.

---

### `apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts` (controller, request-response)

**Do not grow the current AuthController** (env compare + `mock_token_admin_*`, lines 5-21). Rebuild it like `PlateController`.

**Analog:** `apps/plateflow-api/src/infrastructure/http/controllers/PlateController.ts`.

**Imports + constructor DI** (lines 1-14):
```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GetPlatesUseCase } from '../../../core/use-cases/plates/GetPlatesUseCase.js';

export class PlateController {
  constructor(
    private getPlatesUseCase: GetPlatesUseCase,
    private createBatchUseCase: CreateBatchPlatesUseCase,
    // ...
  ) {}
```

**Error handling** (lines 16-22, 25-31): try/catch, `reply.status(N).send({ error: err.message || 'Portuguese fallback' })`. Login/me → 401; change-password validation → 400; unexpected → 500 like `getAll`.

Keep login 401 copy from current `AuthController.ts` line 21: `{ error: 'Credenciais inválidas.' }`. Keep `/me` 401 copy line 38: `{ error: 'Sessão inválida ou expirada.' }`.

**Cookies** belong on `reply` here (or a tiny helper next to the controller): no analog — copy RESEARCH `reply.setCookie` flags (`httpOnly`, `secure` when `NODE_ENV === 'production' || VERCEL`, `sameSite: 'lax'`). Login JSON is `{ user }` only — delete `token` (current lines 11-18).

**`/me`:** stop re-checking the prefix (lines 24-36). After `requireAuth`, return `req.user` mapped to `AuthUser`.

---

### `apps/plateflow-api/src/infrastructure/http/routes/authRoutes.ts` (route, request-response)

**Analog:** `apps/plateflow-api/src/infrastructure/http/routes/plateRoutes.ts`.

**Composition root** (lines 1-22): instantiate Drizzle repos → use cases → controller inside the plugin. Do **not** keep `new AuthController()` with zero deps (current `authRoutes.ts` lines 4-5).

**preHandler** (lines 24-28):
```typescript
app.get('/', (req, reply) => controller.getAll(req, reply));
app.post('/batch', { preHandler: [requireAuth] }, (req: any, reply) => controller.createBatch(req, reply));
```

Map: `POST /login` public; `GET /me`, `POST /logout`, `POST /change-password` use `preHandler: [requireAuth]`; `POST /refresh` reads the refresh cookie (not access jwt — do not use `requireAuth` there).

**JSON Schema:** no analog in the repo (no Fastify `schema:` on routes). Add `body` schema on login / change-password per RESEARCH (email + non-empty password). Do not add Zod.

**Prefix:** `app.ts` line 65 already registers `{ prefix: '/api/auth' }`.

---

### `apps/plateflow-api/src/infrastructure/http/app.ts` (config, request-response)

**Analog:** same file.

**Logger off in tests** (lines 13-14): keep `logger: process.env.NODE_ENV !== 'test'`.

**Error handler** (lines 20-27): keep payload-too-large; do not replace with a global jwt hook.

**CORS** (lines 31-35) — must change in this PR:
```typescript
app.register(cors, {
  origin: true, // REPLACE with APP_ORIGIN allowlist
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
});
```

Keep `credentials: true`. Set `origin` to `APP_ORIGIN` (string or `split(',')`). Do **not** allowlist Vite `:5173` (D-02).

**Plugin order (no analog):** register `@fastify/cookie` then `@fastify/jwt` after CORS/formbody (RESEARCH Pattern 1). Cookie name `plateflow_access`, `onlyCookie: true`, `signed: false`. **Do not** `addHook('onRequest', jwtVerify)`.

**Fail-closed:** before listen/seed, if `NODE_ENV === 'production' || process.env.VERCEL`, throw when `JWT_SECRET` (min 32 bytes) or `ADMIN_EMAIL` / `ADMIN_PASSWORD` missing. Delete compiled `admin@plateflow.com` / `plateflow2026` (currently `AuthController.ts` lines 6-7).

**Health** (lines 40-54) stays unauthenticated.

**Public plugin** (line 70): `app.register(publicRedirectRoutes)` must remain **without** `requireAuth`.

---

### GET locks — `plateRoutes.ts` / `redirectRoutes.ts` / `templateRoutes.ts` / `analyticsRoutes.ts` (route, request-response)

**Analog:** mutation lines already using `preHandler: [requireAuth]`.

`plateRoutes.ts` line 24 GET is public today — add the same option as line 25:
```typescript
app.get('/', { preHandler: [requireAuth] }, (req, reply) => controller.getAll(req, reply));
```

Same for `redirectRoutes.ts` line 15, `templateRoutes.ts` line 17, `analyticsRoutes.ts` line 10.

**Do not** add `requireAuth` to `publicRedirectRoutes.ts` lines 220-221:
```typescript
app.get('/r/:slug', handleRedirect);
app.get('/api/redirects/:slug/resolve', handleRedirect);
```

---

### `apps/plateflow-api/src/infrastructure/database/DrizzleAnalyticsRepository.ts` (service, transform)

**Analog:** same file `mapRow` (lines 38-52). Strip `ip` from the returned object. **Keep** `create()` writing `ip: log.ip || ''` (lines 20-35) so scans still persist IP.

**Do not change** `ResolveRedirectUseCase.ts` lines 20-33 (`ip: logMeta.ip || ''`) — that is the write path, not the DTO.

---

### `packages/types/src/index.ts` (model, transform)

**Analog:** same file.

`AuthUser` (lines 84-89) already has `id?`, `email`, `name?`, `role: 'admin' | 'user'`. Make `id` required for `/me` after seed.

`AnalyticsLog.ip?` (line 81): stop emitting it from `mapRow`. Optional type field may remain so `ResolveRedirectUseCase` still compiles; do not put it on JSON responses.

`apps/plateflow-app/src/types.ts` is `export * from '@plateflow/types'` — no duplicate interface.

---

### `apps/plateflow-api/src/auth/auth.inject.test.ts` (test, request-response)

**Analog (HTTP only):** `apps/plateflow-api/src/server.ts` lines 47-52 — the only in-repo `app.inject` usage.

```typescript
const response = await app.inject({
  method: req.method || 'GET',
  url: targetUrl,
  headers,
  payload,
});
```

No `*.test.ts` exists. Use `node:test` + `createFastifyApp()` + `app.close()` in `after`. Set `NODE_ENV=test` so logger stays off (`app.ts` line 14). Script analog: add `"test": "node --import tsx --test src/**/*.test.ts"` next to `"lint": "tsc --noEmit"` in `apps/plateflow-api/package.json` lines 6-10. `tsx` is already a devDependency (line 26).

---

### `apps/plateflow-app/src/services/storageService.ts` (service, request-response)

**Analog:** same file — wrap every `/api/*` call except public scan.

**Keys to delete** (lines 10-16, 37-39, 57):
```typescript
AUTH_TOKEN: 'nfc_qr_auth_token_v2',
AUTH_USER: 'nfc_qr_auth_user_v2',
function getAuthHeader() { /* DELETE Bearer */ }
localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token); // DELETE
```

Keep `AUTH_USER` for shell paint only (CONTEXT discretion). Also `localStorage.removeItem('plateflow_auth_token')` on login/logout/load (`App.tsx` lines 166-168 still reads it).

**Login fetch** (lines 48-52): add `credentials: 'include'`. Stop expecting `data.token`.

**verifyAuth must not cache on failure** (lines 74-89) — current `catch { return this.getAuthUser() }` is Pitfall 6:
```typescript
} catch {
  return this.getAuthUser(); // FORBIDDEN after this phase
}
```
On 401: `logout()` (clear tokens + optionally AUTH_USER) and return `null`. Network errors during `/me`: still do not restore a session from cache when the status is 401.

**GET cache fallback** (`fetchPlates` 211-222, `fetchAnalytics` 403-414, same for templates/redirects): on 401, logout and return `[]`. Do not `return this.getPlates()`.

**Single `apiFetch`:** add `credentials: 'include'`, omit `Authorization`. On 401 (URL not login/refresh/logout): `POST /api/auth/refresh` once, retry. If refresh fails: if ZIP in-flight, return 401 without `setUser(null)`; else logout.

Move `App.tsx` `POST /api/plates/batch` (lines 164-176) onto this wrapper (`generateBatch` already POSTs batch at lines 377-382 — prefer one path).

---

### `apps/plateflow-app/src/components/LoginScreen.tsx` (component, request-response)

**Analog:** same file — keep layout. Header password form copies its zinc form, not `LoginModal.tsx`.

**Imports** (lines 1-11): `lucide-react` + `Button, Input, Card` from `./ui`.

**Submit** (lines 23-36): `e.preventDefault()`, `isLoading` via Button, Portuguese fallback `Credenciais inválidas.`

**Error banner** (lines 61-66):
```tsx
<div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
  <span>{error}</span>
</div>
```

**Fields** (lines 69-88): `Input` `type="email"|"password"`, labels **E-mail** / **Senha**, `leftIcon` Mail/Lock.

**CTA** (lines 91-100): `Button variant="primary" size="md" isLoading`.

**Anti-pattern:** `LoginModal.tsx` (slate/indigo/Supabase copy). Do not restore it.

---

### `apps/plateflow-app/src/components/Header.tsx` (component, request-response)

**Analog:** same file user chip (lines 119-133) + `EditRedirectModal.tsx` Modal form (lines 110-124, 366-387) + `LoginScreen` banner/inputs.

**User chip to turn into disclosure** (lines 120-132):
```tsx
<div className="flex items-center gap-1.5 sm:gap-2 border border-zinc-700 bg-zinc-900 rounded-lg px-2 sm:px-2.5 py-1 text-xs text-zinc-200">
  <span className="hidden md:inline font-mono text-zinc-300 font-medium max-w-[100px] truncate">
    {user.email.split('@')[0]}
  </span>
  <button onClick={onLogout} title="Encerrar sessão" aria-label="Sair da conta">
    <LogOut className="h-3.5 w-3.5" />
  </button>
</div>
```

Chip becomes `button` with `aria-haspopup="menu"` / `aria-expanded`. Panel: `absolute right-0 mt-2 z-50 min-w-[180px] rounded-lg border-zinc-700 bg-zinc-900 py-1`. Items: **Alterar senha** (`Lock` 14px `text-zinc-400`) then **Sair** (`LogOut`, `hover:text-rose-400`). No Radix, no router.

**Password Modal analog:** `ui/Modal.tsx` (Escape + backdrop, `aria-label="Fechar modal"` lines 27-41, 87-93). `size="sm"`. Title/description from UI-SPEC. Fields via `Input` (`error` prop lines 51-53). Footer buttons: UI-SPEC wants **Cancelar** `variant="outline"` — `EditRedirectModal` uses `ghost` (lines 367-375); **prefer UI-SPEC outline**. Submit `variant="primary"` `isLoading` like LoginScreen.

**Toast success:** `App.tsx` `showToast` (lines 76-78, 381) — copy `showToast('Senha alterada.')`. Do not invent a banner.

---

### `apps/plateflow-app/src/App.tsx` (component, request-response)

**Analog:** same file.

**Auth gate** (lines 44-45, 113-125, 349-368): keep `isCheckingAuth` spinner (`Loader2` on zinc-950). `!user` → only `LoginScreen`. After login, `loadDataFromBackend()`.

**Logout** (lines 391-394):
```typescript
onLogout={() => {
  StorageService.logout();
  setUser(null);
}}
```
Logout must also `POST /api/auth/logout` with `credentials: 'include'` (new StorageService method).

**Batch leak** (lines 164-176): delete Bearer read of `nfc_qr_auth_token_v2` / `plateflow_auth_token`. Persist via StorageService cookie fetch.

**D-07:** `BatchGeneratorModal` already refuses close while `isProcessing` (lines 118-120). App must **not** `setUser(null)` while that flag is true. Add `batchInFlight` / `pendingLogout`: finish ZIP, then gate to LoginScreen. No analog for pendingLogout — new state next to `isBatchModalOpen` (line 56).

Do not paint Header/inventory until `/me` succeeds. Initial `useState(() => StorageService.getAuthUser())` may stay for paint, but 401 must clear it.

---

### `apps/plateflow-app/src/components/BatchGeneratorModal.tsx` (component, file-I/O)

**Analog:** same file. Do **not** rebuild canvas/ZIP (`ImageComposerService.generateBatchZip` lines 91-98). Keep `isProcessing` lock (line 36, 118-120, 288). SHOP-01 = cookie persist in StorageService/App, not a new modal.

---

### `apps/plateflow-app/src/components/DashboardOverview.tsx` (component, request-response)

**Analog:** same file. Columns already **Placa / Dispositivo / Data e Horário** only (lines 164-166). Never render `log.ip`. EmptyState copy already matches UI-SPEC (line 119). No UI change required if DTO omits IP.

---

### `.env.example` / `turbo.json` (config)

**Analog:** `.env.example` lines 4-14 already list `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`, `APP_URL`. Add `APP_ORIGIN` (do not treat `VITE_API_URL` as the cookie origin — D-02 same-origin).

`turbo.json` `globalEnv` (lines 3-9): add `APP_ORIGIN` next to `JWT_SECRET`. Start **reading** `JWT_SECRET` in `app.ts`.

`apps/plateflow-api/package.json`: add `@fastify/jwt` / `@fastify/cookie`; keep Fastify `^5.2.1`; esbuild already `--external:@fastify/*` (line 8).

---

## Shared Patterns

### Clean Architecture composition
**Source:** `apps/plateflow-api/src/infrastructure/http/routes/plateRoutes.ts` lines 12-22
**Apply to:** auth routes + any new HTTP surface

Route plugin constructs `Drizzle*Repository` → `*UseCase` → `*Controller`. Core (`use-cases/`, `repositories/`, `ports/`) must not import `fastify` or `drizzle-orm`. JWT/scrypt live only under `infrastructure/`.

### Portuguese `{ error }` responses
**Source:** `PlateController.ts` lines 16-31; `authMiddleware.ts` lines 7-10
**Apply to:** AuthController, requireAuth, origin guard

Use cases `throw new Error('Portuguese.')`. Controllers `reply.status(...).send({ error: err.message || fallback })`. No `AppError` class exists — do not invent one.

### Per-route `requireAuth`, never global jwtVerify
**Source:** `plateRoutes.ts` line 25; `publicRedirectRoutes.ts` lines 220-221
**Apply to:** all inventory/analytics/template GETs + `/api/auth/me`

`preHandler: [requireAuth]` on private routes. Public: `/r/:slug`, `/api/redirects/:slug/resolve`, `/api/health`, `POST /api/auth/login`.

### Idempotent Drizzle seed
**Source:** `packages/database/src/client.ts` lines 110-148
**Apply to:** admin user insert

`insert().values().onConflictDoNothing()` (email unique). Never `onConflictDoUpdate` of `password_hash` from env.

### SPA fetch + localStorage
**Source:** `storageService.ts` `login` / `verifyAuth` / `fetchPlates`
**Apply to:** all authenticated `/api/*`

After this phase: `credentials: 'include'`, no Bearer, no token keys, 401 ≠ cache hit. Profile key `nfc_qr_auth_user_v2` optional for paint.

### Console UI (zinc / Tailwind 4)
**Source:** `LoginScreen.tsx`, `Header.tsx`, `components/ui/*`
**Apply to:** Header account menu + change-password modal

Import from `./ui` barrel (`components/ui/index.ts`). Portuguese copy. Do not copy `LoginModal.tsx`. Do not add shadcn/Radix/react-router.

### Fastify inject for tests
**Source:** `apps/plateflow-api/src/server.ts` lines 47-52
**Apply to:** `src/auth/auth.inject.test.ts`

`createFastifyApp()` + `inject({ method, url, headers, payload })`. Cookies via inject `cookies` after login Set-Cookie. No Jest/Vitest.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `packages/database/drizzle/*_add-identity-tables.sql` | migration | file-I/O | `drizzle/` folder empty; migrate.ts never applies SQL. Use RESEARCH custom SQL + kit journal. |
| `apps/plateflow-api/src/core/ports/IPasswordHasher.ts` | utility | transform | No `core/ports/` directory. Define a small interface; implement in infrastructure. |
| `apps/plateflow-api/src/core/ports/ITokenIssuer.ts` | utility | transform | No JWT/token port exists. Access JWT stays in infrastructure (`@fastify/jwt`). |
| `apps/plateflow-api/src/infrastructure/auth/FastifyTokenIssuer.ts` | service | transform | No `@fastify/jwt` usage. Copy RESEARCH Pattern 1 (`cookie` + `onlyCookie: true`) and cookie flags. |
| Fastify JSON Schema on login/change-password | config | request-response | No route in the repo uses `schema:`. Add Fastify built-in JSON Schema; do not add Zod. |

Planner should use RESEARCH.md Patterns 1–4 for cookie/JWT/scrypt/refresh; use the analogs above for everything that already exists (routes, DI, Drizzle, SPA, UI).

---

## Anti-Patterns (do not copy)

| File | Why |
|------|-----|
| `apps/plateflow-app/src/components/LoginModal.tsx` | Legacy slate/indigo “Supabase” login. CONTEXT/UI-SPEC: keep zinc `LoginScreen`. |
| `AuthController.ts` lines 5-16 | Env plaintext compare + `mock_token_admin_*` + `token` in JSON. Delete in the same change as cookies. |
| `storageService.ts` `verifyAuth` catch → `getAuthUser()` | Pitfall 6 — paints a stale session when `/me` fails. |
| `storageService.ts` `fetchPlates`/`fetchAnalytics` fallback to `getPlates()`/`getAnalytics()` on non-ok | After GET locks, anonymous tabs would still see inventory/IP cache. |
| Global `onRequest` `jwtVerify` | 401s printed-plate scans (`GET /r/:slug`). |

---

## Metadata

**Analog search scope:** `apps/plateflow-api/src/**`, `apps/plateflow-app/src/**`, `packages/database/**`, `packages/types/**`, `.env.example`, `turbo.json`
**Files scanned:** 37 API ts + 29 app ts/tsx + 6 package ts + 0 existing `*.test.ts`
**Tracked-source gate:** every analog path above is `git ls-files` tracked
**Pattern extraction date:** 2026-09-21
