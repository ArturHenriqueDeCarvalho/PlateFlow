---
last_mapped_commit: 05d7e8c0cd75d9708d937e833856f04c7c7afdd1
last_mapped_at: 2026-09-20
---
<!-- refreshed: 2026-09-20 -->

# Architecture

**Analysis Date:** 2026-09-20

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     Unified Process / Host                              │
│  Root `server.ts` (dev: Fastify + Vite middleware)                      │
│  Vercel `api/index.ts` → `apps/plateflow-api/src/server.ts` handler     │
├──────────────────────────────┬──────────────────────────────────────────┤
│   PWA Admin SPA              │   Public Scan Landing                    │
│   `apps/plateflow-app`       │   GET `/r/:slug` HTML / 307              │
│   `src/App.tsx`              │   `publicRedirectRoutes.ts`              │
└──────────────┬───────────────┴──────────────────┬───────────────────────┘
               │  /api/* Bearer token             │
               ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     HTTP Adapter (Fastify)                               │
│         `apps/plateflow-api/src/infrastructure/http/`                    │
│   routes → controllers → `requireAuth` on mutations                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Application Core                                     │
│         `apps/plateflow-api/src/core/`                                   │
│   entities (`@plateflow/types`) · repository ports · use cases           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Persistence / Shared Packages                                           │
│  Drizzle repos `apps/plateflow-api/src/infrastructure/database/`         │
│  Schema + pool `@plateflow/database` → PostgreSQL (`DATABASE_URL`)       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Unified host | Starts Fastify, mounts Vite in dev, serves SPA `index.html` in prod, skips listen on Vercel | `server.ts` |
| Vercel adapter | Re-exports the compiled Fastify inject handler | `api/index.ts` |
| Fastify factory | CORS, formbody, 10MB body limit, health check, route registration, template seed | `apps/plateflow-api/src/infrastructure/http/app.ts` |
| Serverless handler | Rewrites `__route` query, `app.inject()`, maps Node req/res | `apps/plateflow-api/src/server.ts` |
| Auth | Env-var admin login + `mock_token_admin_*` prefix check | `apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts`, `apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts` |
| Plate use cases | List, batch create, update, delete (cascade redirect) | `apps/plateflow-api/src/core/use-cases/plates/` |
| Redirect use cases | List, update destination, resolve + fire-and-forget analytics | `apps/plateflow-api/src/core/use-cases/redirects/` |
| Template use cases | List, create/upsert, delete | `apps/plateflow-api/src/core/use-cases/templates/` |
| Analytics use cases | List logs; `LogAnalyticsUseCase` is unused by HTTP | `apps/plateflow-api/src/core/use-cases/analytics/` |
| Drizzle adapters | Map snake_case rows ↔ camelCase domain types | `apps/plateflow-api/src/infrastructure/database/` |
| Domain types | Shared `PhysicalPlate`, `DynamicRedirect`, `PlateTemplate`, `AnalyticsLog`, `AuthUser` | `packages/types/src/index.ts` |
| DB client | Singleton `pg.Pool` + Drizzle `db`, Supabase pooler rewrite, seed | `packages/database/src/client.ts` |
| Schema | Tables `templates`, `redirects`, `plates`, `analytics` | `packages/database/src/schema/index.ts` |
| SPA orchestrator | Auth gate, tab nav, modal state, public `/r/:slug` fallback UI | `apps/plateflow-app/src/App.tsx` |
| API + cache client | `fetch('/api/...')` + `localStorage` keys `nfc_qr_*_v2` | `apps/plateflow-app/src/services/storageService.ts` |
| Print compositor | Canvas QR stamp + JSZip batch export | `apps/plateflow-app/src/services/imageComposerService.ts` |
| Pix / vCard | BR Code payload and `.vcf` string for public pages | `apps/plateflow-api/src/infrastructure/services/PixCodeService.ts`, `apps/plateflow-api/src/infrastructure/services/VCardService.ts` |

## Pattern Overview

**Overall:** pnpm/Turbo monorepo with Clean Architecture on the API and a single-orchestrator React PWA (no client router).

**Key Characteristics:**

- Dependency rule: `core/` imports only `@plateflow/types` and repository interfaces. Infrastructure implements those interfaces with Drizzle.
- Composition happens inside each Fastify plugin (`*Routes.ts`): `new Drizzle*Repository()` → `new *UseCase(repo)` → `new *Controller(...)`.
- Shared contracts live in `@plateflow/types`. Persistence lives in `@plateflow/database`. Do not redefine domain shapes in the API or SPA.
- One Node process serves both `/api/*`, `/r/:slug`, and the SPA. Vercel splits the same Fastify app through `app.inject()`.

## Layers

**PWA / Presentation (SPA):**

- Purpose: Admin console (dashboard, inventory, templates, simulator) and a client-side `/r/:slug` fallback when the request is treated as an SPA route.
- Location: `apps/plateflow-app/src/`
- Contains: `App.tsx` (composition root), feature components, `components/ui/` primitives, `services/`, `hooks/usePWAInstall.ts`
- Depends on: `@plateflow/types` via `apps/plateflow-app/src/types.ts`, relative `/api/*` fetches
- Used by: Browser / PWA (`apps/plateflow-app/index.html`, `apps/plateflow-app/public/manifest.json`)

**HTTP Adapter:**

- Purpose: Translate HTTP into use-case calls; apply CORS, body limits, and mutation auth.
- Location: `apps/plateflow-api/src/infrastructure/http/`
- Contains: `app.ts`, `routes/`, `controllers/`, `middleware/authMiddleware.ts`
- Depends on: Fastify plugins, use cases, Drizzle repositories (wired in routes)
- Used by: `apps/plateflow-api/src/server.ts`, root `server.ts`

**Application Core:**

- Purpose: Business rules — batch plate+redirect creation, cascade delete, resolve-and-log, template validation.
- Location: `apps/plateflow-api/src/core/`
- Contains: `entities/index.ts` (re-export), `repositories/I*.ts`, `use-cases/{plates,redirects,templates,analytics}/`
- Depends on: Repository ports and `@plateflow/types` only
- Used by: HTTP controllers

**Infrastructure Services:**

- Purpose: Side-effect helpers that are not persistence (Pix EMV, vCard).
- Location: `apps/plateflow-api/src/infrastructure/services/`
- Contains: `PixCodeService.ts`, `VCardService.ts`
- Depends on: None (pure functions)
- Used by: `apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts`

**Persistence:**

- Purpose: PostgreSQL access, schema, connection rewrite for Supabase pooler.
- Location: `packages/database/src/` + `apps/plateflow-api/src/infrastructure/database/`
- Contains: `client.ts`, `schema/index.ts`, `migrate.ts`, `Drizzle*Repository.ts`
- Depends on: `drizzle-orm`, `pg`, `@plateflow/types`
- Used by: API infrastructure and `createFastifyApp()` seed/health

**Shared Types:**

- Purpose: Single source of domain types for API and SPA.
- Location: `packages/types/src/index.ts`
- Contains: `RedirectType`, `RedirectStatus`, `DynamicRedirect`, `PlateTemplate`, `PhysicalPlate`, `AnalyticsLog`, `AuthUser`, `BatchGenerationParams`
- Depends on: Nothing
- Used by: `@plateflow/api` entities barrel, `@plateflow/app` `src/types.ts`, `@plateflow/database` schema `jsonb` typing

## Data Flow

### Primary Request Path

Admin list/sync after login:

1. `App` calls `StorageService.verifyAuth()` then `loadDataFromBackend()` (`apps/plateflow-app/src/App.tsx:113`)
2. `StorageService.fetchPlates()` issues `GET /api/plates` and caches JSON (`apps/plateflow-app/src/services/storageService.ts:211`)
3. Fastify plugin `plateRoutes` binds `GET /` to `PlateController.getAll` (`apps/plateflow-api/src/infrastructure/http/routes/plateRoutes.ts:24`)
4. `GetPlatesUseCase.execute()` delegates to `IPlateRepository.findAll()` (`apps/plateflow-api/src/core/use-cases/plates/GetPlatesUseCase.ts:7`)
5. `DrizzlePlateRepository.findAll()` selects `plates` ordered by `created_at` and maps camelCase (`apps/plateflow-api/src/infrastructure/database/DrizzlePlateRepository.ts:6`)
6. Parallel fetches for templates, redirects, and analytics follow the same Route → Controller → UseCase → Drizzle path (`apps/plateflow-app/src/App.tsx:83`)

### Public QR / NFC Resolve

1. Scan hits `GET /r/:slug` or `GET /api/redirects/:slug/resolve` (`apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts:220`)
2. Host routes `/r/*` to Fastify (`server.ts:19`) or Vercel rewrite (`vercel.json:8`)
3. `ResolveRedirectUseCase.execute(slug, logMeta)` loads the redirect (`apps/plateflow-api/src/core/use-cases/redirects/ResolveRedirectUseCase.ts:11`)
4. `DrizzleRedirectRepository.findBySlug()` (`apps/plateflow-api/src/infrastructure/database/DrizzleRedirectRepository.ts:22`)
5. Clicks increment and analytics insert run without awaiting (`apps/plateflow-api/src/core/use-cases/redirects/ResolveRedirectUseCase.ts:16`)
6. Handler branches: 404 / virgin / paused HTML; Pix QR HTML; vCard HTML or `.vcf`; WhatsApp/social/URL `307` (`apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts:45`)

### Batch Creation

1. `BatchGeneratorModal` composes print ZIP via `ImageComposerService.generateBatchZip()` (`apps/plateflow-app/src/components/BatchGeneratorModal.tsx`)
2. `App.handleBatchCreated` `POST /api/plates/batch` with `{ plates, redirects }` (`apps/plateflow-app/src/App.tsx:164`)
3. `requireAuth` accepts `Authorization: Bearer mock_token_admin_*` (`apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts:3`)
4. `CreateBatchPlatesUseCase.execute()` persists redirects first, then plates; rolls back redirects on plate failure (`apps/plateflow-api/src/core/use-cases/plates/CreateBatchPlatesUseCase.ts:46`)
5. `App` re-syncs with `loadDataFromBackend()` (`apps/plateflow-app/src/App.tsx:181`)

### Authentication

1. `LoginScreen` → `StorageService.login()` `POST /api/auth/login` (`apps/plateflow-app/src/services/storageService.ts:46`)
2. `AuthController.login()` compares `ADMIN_EMAIL` / `ADMIN_PASSWORD` and returns `mock_token_admin_${Date.now()}` (`apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts:4`)
3. Token + user stored in `localStorage` keys `nfc_qr_auth_token_v2` / `nfc_qr_auth_user_v2` (`apps/plateflow-app/src/services/storageService.ts:57`)
4. Mutations send `Authorization: Bearer <token>`; lists (`GET /api/plates`, `GET /api/redirects`, `GET /api/templates`, `GET /api/analytics`) are unauthenticated

**State Management:**

- SPA: React `useState` in `apps/plateflow-app/src/App.tsx` is the only store. Hydrate from `localStorage` synchronously, then overwrite from the API.
- Persistence cache: `StorageService` writes `nfc_qr_templates_v2`, `nfc_qr_plates_v2`, `nfc_qr_redirects_v2`, `nfc_qr_analytics_v2`.
- Server: PostgreSQL via module-level Drizzle `db` in `packages/database/src/client.ts`. No Redis or in-process domain cache.
- Auth session: token prefix in `localStorage`, not JWT (`JWT_SECRET` is listed in `turbo.json` but unused).

## Key Abstractions

**Domain entity (shared types):**

- Purpose: Transport and persist plates, redirects, templates, analytics, and the admin user.
- Examples: `packages/types/src/index.ts`, re-exported at `apps/plateflow-api/src/core/entities/index.ts` and `apps/plateflow-app/src/types.ts`
- Pattern: Plain interfaces. Redirect types: `'url' | 'whatsapp' | 'pix' | 'vcard' | 'social'`. Status: `'virgin' | 'active' | 'paused'`.

**Repository port:**

- Purpose: Persistence contract used by use cases.
- Examples: `apps/plateflow-api/src/core/repositories/IPlateRepository.ts`, `IRedirectRepository.ts`, `ITemplateRepository.ts`, `IAnalyticsRepository.ts`
- Pattern: Interface with `find*` / `create*` / `update` / `delete*`. Implement as `DrizzleXRepository` in `apps/plateflow-api/src/infrastructure/database/`.

**Use case class:**

- Purpose: One application action per file (`Get*`, `Create*`, `Update*`, `Delete*`, `Resolve*`).
- Examples: `apps/plateflow-api/src/core/use-cases/plates/CreateBatchPlatesUseCase.ts`, `apps/plateflow-api/src/core/use-cases/redirects/ResolveRedirectUseCase.ts`
- Pattern: Constructor-inject repository ports; single `async execute(...)`. Throw `Error` with a Portuguese message. Do not import Fastify or Drizzle here.

**HTTP controller:**

- Purpose: Map `req`/`reply` to use cases and HTTP status.
- Examples: `apps/plateflow-api/src/infrastructure/http/controllers/PlateController.ts`
- Pattern: Class with injected use cases. `try/catch` → `500` on reads, `400` on writes, `{ error: string }`.

**Route plugin:**

- Purpose: Composition root for one resource + URL prefix.
- Examples: `apps/plateflow-api/src/infrastructure/http/routes/plateRoutes.ts`
- Pattern: `FastifyPluginAsync` that instantiates repos, use cases, and controller, then binds verbs. Attach `{ preHandler: [requireAuth] }` on mutating routes.

**Row mapper:**

- Purpose: Convert Drizzle snake_case / numeric-as-string columns to domain camelCase.
- Examples: `DrizzleTemplateRepository.mapRow` in `apps/plateflow-api/src/infrastructure/database/DrizzleTemplateRepository.ts`, inline maps in `DrizzlePlateRepository.ts`
- Pattern: Never return raw table rows from controllers.

**SPA service object:**

- Purpose: Encapsulate `fetch` + `localStorage` (or canvas/ZIP).
- Examples: `apps/plateflow-app/src/services/storageService.ts`, `apps/plateflow-app/src/services/imageComposerService.ts`
- Pattern: Exported const object of functions. UI components must not call `fetch('/api/...')` except the existing batch POST in `App.tsx` — add new calls on `StorageService`.

## Entry Points

**Unified Node process:**

- Location: `server.ts`
- Triggers: `pnpm dev` / `pnpm start` (`package.json`); skipped when `VERCEL` is set
- Responsibilities: Import `app` from `apps/plateflow-api/src/server.ts`, attach Vite middleware or SPA fallback, `listen` on `PORT` (default `3005`)

**API package process:**

- Location: `apps/plateflow-api/src/server.ts`
- Triggers: `pnpm --filter @plateflow/api dev` when `process.argv[1]` contains `apps/plateflow-api`
- Responsibilities: Export Fastify `app`, Vercel `handler`, and standalone listen

**Vercel serverless:**

- Location: `api/index.ts` → compiled `apps/plateflow-api/dist/server.js`
- Triggers: Rewrites in `vercel.json` for `/api/(.*)` and `/r/(.*)`
- Responsibilities: Forward Node request into Fastify via `inject`

**SPA browser entry:**

- Location: `apps/plateflow-app/src/main.tsx` mounted from `apps/plateflow-app/index.html`
- Triggers: Vite `index.html` script; production static files copied to root `dist/` by `package.json` `build`
- Responsibilities: `createRoot` + `<App />`

**DB migrate / seed:**

- Location: `packages/database/src/migrate.ts`, `packages/database/src/client.ts` `seedDefaultTemplates()`
- Triggers: `pnpm --filter @plateflow/database migrate`; also background seed from `createFastifyApp()` when `DATABASE_URL` is set (`apps/plateflow-api/src/infrastructure/http/app.ts:58`)
- Responsibilities: Connectivity check and default template upsert (`onConflictDoNothing`)

**Health:**

- Location: `GET /api/health` in `apps/plateflow-api/src/infrastructure/http/app.ts`
- Triggers: Load balancer / ops
- Responsibilities: `SELECT 1` via `db.execute`

## Architectural Constraints

- **Threading:** Single-threaded Node event loop. Analytics and click increments are fire-and-forget Promises. No worker threads. PWA install and canvas ZIP run on the browser main thread.
- **Global state:** `poolInstance` / `db` singleton in `packages/database/src/client.ts`. Fastify `app` singleton exported from `apps/plateflow-api/src/server.ts`. `isReady` flag for serverless `app.ready()`. SPA state is module-local React state in `App.tsx` plus `localStorage`.
- **Circular imports:** Not detected. Allowed direction: `http` → `core` → `@plateflow/types`; `database` adapters → `@plateflow/database` + `core` ports. Do not import `infrastructure/` from `core/`.
- **Host routing:** Paths starting with `/api` or `/r/` stay on Fastify. Every other path is Vite (dev) or `dist/index.html` (prod) / Vercel SPA rewrite.
- **Auth model:** Prefix token `mock_token_admin_`, not signed JWT. `requireAuth` only on POST/PUT/DELETE of plates, redirects, and templates.
- **Body size:** Fastify `bodyLimit` 10MB (`apps/plateflow-api/src/infrastructure/http/app.ts:16`) because templates embed `backgroundUrl` data URIs.
- **Workspace graph:** `@plateflow/api` depends on `@plateflow/database` + `@plateflow/types`. `@plateflow/app` depends on `@plateflow/types` only. `@plateflow/database` depends on `@plateflow/types`. Do not add an app → app import.

## Anti-Patterns

### Dual public-redirect implementations

**What happens:** Fastify `publicRedirectRoutes` renders server HTML / 307, while `App.tsx` also matches `/r/:slug` and resolves from `localStorage` via `StorageService.getRedirectBySlug()`.
**Why it's wrong:** SPA fallback shows stale or empty cache when the request is not intercepted by Fastify (standalone Vite on port 5173, or a missed rewrite). Pix/vCard server pages and client countdown UI diverge.
**Do this instead:** Treat `GET /r/:slug` in `apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts` as the only public resolver. Keep the SPA path for the admin simulator (`RedirectSimulatorModal.tsx`), not production scans.

### HTTP composition inside every route file

**What happens:** Each `*Routes.ts` `new`s repositories, use cases, and the controller.
**Why it's wrong:** Duplicate wiring, harder to test, easy to forget `requireAuth` or inject the wrong repo (e.g. `CreateBatchPlatesUseCase` receives `templateRepo` but never uses it).
**Do this instead:** Keep the Route → Controller → UseCase → Repository chain, but compose once in `apps/plateflow-api/src/infrastructure/http/app.ts` (or a `composition.ts`) and pass instances into plugins.

### SPA god-orchestrator + leaky fetch

**What happens:** `apps/plateflow-app/src/App.tsx` owns auth, tabs, all collections, every modal, and a public landing. Batch create calls `fetch` directly instead of `StorageService`.
**Why it's wrong:** New features bloat the orchestrator; API headers/token keys drift (`nfc_qr_auth_token_v2` vs leftover `plateflow_auth_token`).
**Do this instead:** Add screens under `apps/plateflow-app/src/components/` and all HTTP on `StorageService`. Extract tab/public routing out of `App.tsx` when adding a new top-level view.

### Unused or mismatched seams

**What happens:** `LogAnalyticsUseCase` is never imported. `StorageService.recordClick()` `POST`s `/api/analytics`, but `analyticsRoutes` only registers `GET /`. `LoginModal.tsx` and `src/data/initialData.ts` have no importers. Seed lives only on the API.
**Why it's wrong:** Client click logging is a no-op on the server except when `/r/:slug` hits Fastify. Dead files invite the wrong copy-paste.
**Do this instead:** Wire `POST /api/analytics` to `LogAnalyticsUseCase` if the SPA must log; otherwise remove the client POST. Reuse `@plateflow/types` + API seed; do not resurrect `initialData.ts` as a second source of templates.

### Optimistic local writes that ignore HTTP errors

**What happens:** `saveRedirect`, `savePlate`, `deletePlate`, `generateBatch` update `localStorage` even when `fetch` fails (`apps/plateflow-app/src/services/storageService.ts:180`).
**Why it's wrong:** UI and PostgreSQL diverge; a refresh "loses" edits or shows deleted plates again.
**Do this instead:** Await `res.ok`, throw like `saveTemplate` / `deleteTemplate`, and let `App.tsx` toast + resync.

## Error Handling

**Strategy:** Use cases throw `Error`. Controllers catch and map to JSON `{ error }`. Fastify has a global handler for oversized bodies. The SPA shows toasts and falls back to `localStorage` on read failures.

**Patterns:**

- Reads: `reply.status(500).send({ error: err.message || '...' })` — see `PlateController.getAll` in `apps/plateflow-api/src/infrastructure/http/controllers/PlateController.ts`
- Writes: `400` with the use-case message — missing plate/redirect/template, invalid batch params
- Payload: `FST_ERR_CTP_BODY_TOO_LARGE` → `413` in `apps/plateflow-api/src/infrastructure/http/app.ts`
- Public resolve: HTML 404/500, never leak stack traces (`publicRedirectRoutes.ts` catch → `500` text/plain)
- DB messages: `sanitizeErrorMessage()` strips connection strings (`packages/database/src/client.ts`)
- SPA: `saveTemplate` throws on `!res.ok`; list fetches `console.warn` and return cache

## Cross-Cutting Concerns

**Logging:** Fastify logger enabled unless `NODE_ENV === 'test'` (`apps/plateflow-api/src/infrastructure/http/app.ts`). Operational logs use `console.error` / `console.warn` with prefixes `[DB Pool Error]`, `[Vercel Handler Error]`, `[Seed warning]`, `[Clicks Increment Error]`, `[Analytics Log Error]`. Do not log tokens or `DATABASE_URL`.

**Validation:** No Zod/schema library. Validate inside use cases (`CreateTemplateUseCase` requires `name` + `backgroundUrl`; `CreateBatchPlatesUseCase` requires `templateId`, `batchIdentifier`, `quantity >= 1`). Auth is a string prefix check, not a schema.

**Authentication:** Single env-configured admin (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) in `AuthController`. Mutations use `requireAuth`. GETs and `/r/:slug` are public. Do not add a second auth provider in the SPA — comments mentioning Supabase in `App.tsx` / `storageService.ts` do not match the implementation.

---

*Architecture analysis: 2026-09-20*
