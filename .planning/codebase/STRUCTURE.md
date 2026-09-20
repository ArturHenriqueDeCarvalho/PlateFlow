---
last_mapped_commit: 05d7e8c0cd75d9708d937e833856f04c7c7afdd1
last_mapped_at: 2026-09-20
---
# Codebase Structure

**Analysis Date:** 2026-09-20

## Directory Layout

```
PlateFlow/
├── server.ts                 # Unified Fastify + Vite/SPA host
├── package.json              # Root scripts: dev/build/start (pnpm@11.9.0)
├── pnpm-workspace.yaml       # apps/* + packages/*
├── pnpm-lock.yaml
├── turbo.json                # build/lint/dev/clean + globalEnv
├── tsconfig.json             # Root TS (JSX, @/* → repo root)
├── vercel.json               # /api and /r → serverless; else SPA
├── metadata.json             # Product metadata (PWA / Gemini capability flag)
├── .env.example              # Env template (committed). .env* gitignored
├── api/
│   └── index.ts              # Vercel entry: import compiled API handler
├── apps/
│   ├── plateflow-api/        # @plateflow/api — Fastify Clean Architecture
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── server.ts     # app export + Vercel handler + optional listen
│   │       ├── core/
│   │       │   ├── entities/index.ts
│   │       │   ├── repositories/
│   │       │   └── use-cases/{plates,redirects,templates,analytics}/
│   │       └── infrastructure/
│   │           ├── database/           # Drizzle*Repository
│   │           ├── services/           # Pix, vCard
│   │           └── http/
│   │               ├── app.ts
│   │               ├── controllers/
│   │               ├── middleware/
│   │               └── routes/
│   └── plateflow-app/        # @plateflow/app — React 19 + Vite PWA
│       ├── index.html
│       ├── vite.config.ts    # alias @ → src, outDir dist
│       ├── tsconfig.json
│       ├── public/           # manifest.json, icon.svg
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── types.ts      # re-export @plateflow/types
│           ├── index.css
│           ├── components/   # screens + modals
│           │   └── ui/       # primitives + barrel
│           ├── services/
│           ├── hooks/
│           └── data/         # unused default-template SVGs
├── packages/
│   ├── types/                # @plateflow/types
│   │   └── src/index.ts
│   ├── database/             # @plateflow/database
│   │   ├── drizzle.config.ts
│   │   └── src/{client,migrate,schema,index}.ts
│   └── tsconfig/             # @plateflow/tsconfig (base.json)
├── .planning/                # GSD planning artifacts (this map)
└── .cursor/                  # GSD skills/agents (not application code)
```

## Directory Purposes

**`apps/plateflow-api/src/core/`:**

- Purpose: Application business logic with no Fastify/Drizzle imports
- Contains: Entity re-exports, `I*Repository` ports, `*UseCase.ts` classes
- Key files: `apps/plateflow-api/src/core/entities/index.ts`, `apps/plateflow-api/src/core/use-cases/plates/CreateBatchPlatesUseCase.ts`, `apps/plateflow-api/src/core/use-cases/redirects/ResolveRedirectUseCase.ts`

**`apps/plateflow-api/src/infrastructure/http/`:**

- Purpose: Fastify composition and HTTP mapping
- Contains: App factory, one plugin per resource, controllers, `requireAuth`
- Key files: `apps/plateflow-api/src/infrastructure/http/app.ts`, `apps/plateflow-api/src/infrastructure/http/routes/plateRoutes.ts`, `apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts`

**`apps/plateflow-api/src/infrastructure/database/`:**

- Purpose: Drizzle implementations of repository ports
- Contains: `DrizzlePlateRepository.ts`, `DrizzleRedirectRepository.ts`, `DrizzleTemplateRepository.ts`, `DrizzleAnalyticsRepository.ts`
- Key files: `apps/plateflow-api/src/infrastructure/database/DrizzlePlateRepository.ts`

**`apps/plateflow-api/src/infrastructure/services/`:**

- Purpose: Non-DB adapters used by public HTML responses
- Contains: Pix EMV builder, vCard serializer
- Key files: `apps/plateflow-api/src/infrastructure/services/PixCodeService.ts`, `apps/plateflow-api/src/infrastructure/services/VCardService.ts`

**`apps/plateflow-app/src/components/`:**

- Purpose: Feature screens and modals consumed by `App.tsx`
- Contains: `DashboardOverview.tsx`, `PlatesInventory.tsx`, `TemplateManager.tsx`, `Header.tsx`, `LoginScreen.tsx`, batch/edit/NFC/preview/simulator modals
- Key files: `apps/plateflow-app/src/components/PlatesInventory.tsx`, `apps/plateflow-app/src/components/BatchGeneratorModal.tsx`

**`apps/plateflow-app/src/components/ui/`:**

- Purpose: Presentational primitives only (no `fetch`, no domain writes)
- Contains: `Button`, `Input`, `Select`, `Badge`, `Modal`, `PageHeader`, `EmptyState`, `Toast`, `Card`
- Key files: `apps/plateflow-app/src/components/ui/index.ts`

**`apps/plateflow-app/src/services/`:**

- Purpose: Browser-side I/O
- Contains: REST + `localStorage` client; canvas QR compositor + ZIP
- Key files: `apps/plateflow-app/src/services/storageService.ts`, `apps/plateflow-app/src/services/imageComposerService.ts`

**`packages/types/src/`:**

- Purpose: Canonical domain types for both apps
- Contains: Single `index.ts` with interfaces and union types
- Key files: `packages/types/src/index.ts`

**`packages/database/src/`:**

- Purpose: Pool, Drizzle instance, schema, seed, migrate script
- Contains: `client.ts`, `schema/index.ts`, `migrate.ts`, barrel `index.ts`
- Key files: `packages/database/src/client.ts`, `packages/database/src/schema/index.ts`

**`api/`:**

- Purpose: Vercel serverless shim only
- Contains: `api/index.ts` importing `apps/plateflow-api/dist/server.js`
- Key files: `api/index.ts`

## Key File Locations

**Entry Points:**

- `server.ts`: Monorepo process (dev Vite middleware + prod SPA fallback)
- `apps/plateflow-api/src/server.ts`: Fastify export, Vercel `handler`, API-only listen
- `apps/plateflow-api/src/infrastructure/http/app.ts`: Plugin registration and `/api/health`
- `apps/plateflow-app/src/main.tsx`: React mount
- `apps/plateflow-app/src/App.tsx`: SPA composition root (auth, tabs, public slug UI)
- `api/index.ts`: Vercel function entry
- `packages/database/src/migrate.ts`: Connectivity + seed check

**Configuration:**

- `package.json`: `dev` = `tsx server.ts`; `build` = turbo then copy `apps/plateflow-app/dist/*` → `dist/`
- `pnpm-workspace.yaml`: workspace globs
- `turbo.json`: `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`, `PORT`, `NODE_ENV`
- `vercel.json`: rewrite `/api/*` and `/r/*` to `/api/index?__route=...`
- `apps/plateflow-app/vite.config.ts`: `@` → `./src`, `build.outDir` = `dist`
- `apps/plateflow-app/tsconfig.json`: `@/*` → `./src/*`
- `packages/database/drizzle.config.ts`: schema `./src/schema/index.ts`, dialect `postgresql`
- `.env.example`: required env names (do not commit `.env`)

**Core Logic:**

- `apps/plateflow-api/src/core/use-cases/`: application actions
- `apps/plateflow-api/src/infrastructure/database/`: SQL/Drizzle
- `apps/plateflow-api/src/infrastructure/http/routes/`: URL surface
- `packages/types/src/index.ts`: shared contracts
- `packages/database/src/schema/index.ts`: tables `templates`, `redirects`, `plates`, `analytics`
- `apps/plateflow-app/src/services/storageService.ts`: SPA API client
- `apps/plateflow-app/src/services/imageComposerService.ts`: print pipeline

**Testing:**

- Not detected (no `*.test.*` / `*.spec.*` under `apps/` or `packages/`)

**HTTP surface (prefixes from `app.ts`):**

- `POST /api/auth/login`, `GET /api/auth/me` — `apps/plateflow-api/src/infrastructure/http/routes/authRoutes.ts`
- `GET|POST|PUT|DELETE /api/plates` — `apps/plateflow-api/src/infrastructure/http/routes/plateRoutes.ts`
- `GET|PUT /api/redirects` — `apps/plateflow-api/src/infrastructure/http/routes/redirectRoutes.ts`
- `GET|POST|DELETE /api/templates` — `apps/plateflow-api/src/infrastructure/http/routes/templateRoutes.ts`
- `GET /api/analytics` — `apps/plateflow-api/src/infrastructure/http/routes/analyticsRoutes.ts`
- `GET /r/:slug`, `GET /api/redirects/:slug/resolve` — `apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts`

## Naming Conventions

**Files:**

- Use case: `PascalCase` + `UseCase.ts` — `CreateBatchPlatesUseCase.ts`
- Repository port: `I` + entity + `Repository.ts` — `IPlateRepository.ts`
- Drizzle adapter: `Drizzle` + entity + `Repository.ts` — `DrizzlePlateRepository.ts`
- Controller: entity + `Controller.ts` — `PlateController.ts`
- Route plugin: camelCase resource + `Routes.ts` — `plateRoutes.ts`, `publicRedirectRoutes.ts`
- Middleware: camelCase + `Middleware.ts` — `authMiddleware.ts`
- Domain service (infra): PascalCase + `Service.ts` — `PixCodeService.ts`
- React screen/modal: PascalCase `.tsx` — `PlatesInventory.tsx`, `EditRedirectModal.tsx`
- UI primitive: PascalCase `.tsx` in `components/ui/` — `Button.tsx`
- SPA service: camelCase + `Service.ts` — `storageService.ts`
- Hook: `use` + PascalCase `.ts` — `usePWAInstall.ts`
- API imports: use `.js` extension in relative ESM imports (`from './infrastructure/http/app.js'`)

**Directories:**

- kebab-case apps/packages: `plateflow-api`, `plateflow-app`
- kebab-case use-case folders: `use-cases/plates/`
- Plural resource folders: `controllers/`, `routes/`, `repositories/`
- `components/ui/` for primitives only

**Symbols:**

- Use cases / controllers / repos: `PascalCase` classes
- Route plugins: `camelCase` exported const (`plateRoutes`)
- Domain fields: `camelCase` (`destinationUrl`, `nfcWritten`)
- SQL columns: `snake_case` (`destination_url`, `nfc_written`) — map in the Drizzle adapter
- Env: `SCREAMING_SNAKE_CASE` (`DATABASE_URL`, `ADMIN_EMAIL`)
- `localStorage` keys: `nfc_qr_<resource>_v2`

## Where to Add New Code

**New API resource (example: customers):**

- Domain type: `packages/types/src/index.ts` (export from there; re-export automatically via `apps/plateflow-api/src/core/entities/index.ts` and `apps/plateflow-app/src/types.ts`)
- Table: `packages/database/src/schema/index.ts` + export from `packages/database/src/index.ts`
- Port: `apps/plateflow-api/src/core/repositories/ICustomerRepository.ts`
- Use cases: `apps/plateflow-api/src/core/use-cases/customers/GetCustomersUseCase.ts` (one file per action)
- Adapter: `apps/plateflow-api/src/infrastructure/database/DrizzleCustomerRepository.ts`
- Controller: `apps/plateflow-api/src/infrastructure/http/controllers/CustomerController.ts`
- Routes: `apps/plateflow-api/src/infrastructure/http/routes/customerRoutes.ts` then `app.register(customerRoutes, { prefix: '/api/customers' })` in `apps/plateflow-api/src/infrastructure/http/app.ts`
- Mutations: `{ preHandler: [requireAuth] }`
- SPA client methods: `apps/plateflow-app/src/services/storageService.ts`
- SPA UI: new component under `apps/plateflow-app/src/components/` wired from `App.tsx`
- Tests: Not applicable yet — when added, colocate `*.test.ts` next to the use case or under `apps/plateflow-api/src/core/use-cases/customers/`

**New redirect type (`RedirectType` union):**

- Extend the union in `packages/types/src/index.ts`
- Add metadata fields on `DynamicRedirectMetadata` in the same file
- Handle the type in `apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts`
- Add a helper under `apps/plateflow-api/src/infrastructure/services/` if the payload is non-trivial (follow `PixCodeService.ts`)
- Update `EditRedirectModal.tsx` and any simulator UI

**New admin screen / tab:**

- Component: `apps/plateflow-app/src/components/YourScreen.tsx`
- Extend `activeTab` union in `apps/plateflow-app/src/App.tsx` and nav in `apps/plateflow-app/src/components/Header.tsx`
- Data access only through `StorageService`

**New UI primitive:**

- Implementation: `apps/plateflow-app/src/components/ui/YourPrimitive.tsx`
- Export from `apps/plateflow-app/src/components/ui/index.ts`
- Import as `import { YourPrimitive } from './components/ui'`

**New shared helper (API, non-HTTP):**

- Pure / infra helper: `apps/plateflow-api/src/infrastructure/services/`
- Cross-app type or DTO: `packages/types/src/index.ts`
- SQL/connection: `packages/database/src/` only — do not open a second pool

**Utilities (SPA):**

- Shared helpers: `apps/plateflow-app/src/services/` (I/O) or a new `apps/plateflow-app/src/lib/` only if the helper is pure and reused by 2+ components
- Hooks: `apps/plateflow-app/src/hooks/useX.ts`

**Do not put new application code in:**

- `api/` — Vercel shim only
- Root `server.ts` — host glue only (Vite vs static)
- `apps/plateflow-app/src/data/initialData.ts` — unused; seed via `packages/database/src/client.ts`
- `apps/plateflow-app/src/components/LoginModal.tsx` — unused; login UI is `LoginScreen.tsx`
- `.cursor/` or `.planning/` — tooling, not product

## Special Directories

**`dist/` (repo root and per-app):**

- Purpose: Production SPA copy (root) and API bundle (`apps/plateflow-api/dist/server.js` via esbuild)
- Generated: Yes
- Committed: No (`.gitignore`)

**`packages/database/drizzle/`:**

- Purpose: drizzle-kit generated migrations (`db:generate`)
- Generated: Yes (when generate is run)
- Committed: Commit generated SQL if the team uses migrate-from-files; folder is currently absent

**`.env*` / `.env.example`:**

- Purpose: Runtime secrets and documented variable names
- Generated: No
- Committed: `.env.example` yes; `.env*` no

**`.planning/`:**

- Purpose: GSD roadmap, codebase map, phase artifacts
- Generated: By GSD commands
- Committed: Per project convention (this folder is the map target)

**`.cursor/` / `.turbo/`:**

- Purpose: Agent skills / Turbo cache
- Generated: Skills committed; `.turbo/` cache gitignored
- Committed: Skills yes; cache no

**`apps/plateflow-app/public/`:**

- Purpose: PWA static assets copied by Vite
- Generated: No
- Committed: Yes (`manifest.json`, `icon.svg`)

**`node_modules/`:**

- Purpose: pnpm workspace install
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-09-20*
