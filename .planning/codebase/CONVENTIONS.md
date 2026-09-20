---
last_mapped_commit: 05d7e8c0cd75d9708d937e833856f04c7c7afdd1
last_mapped_at: 2026-09-20
---
# Coding Conventions

**Analysis Date:** 2026-09-20

## Naming Patterns

**Files:**

- Use PascalCase for API classes and React components: `PlateController.ts`, `CreateBatchPlatesUseCase.ts`, `DrizzlePlateRepository.ts`, `LoginScreen.tsx`, `Button.tsx`
- Prefix repository contracts with `I` and keep one interface per file: `IPlateRepository.ts`, `IRedirectRepository.ts`, `ITemplateRepository.ts`, `IAnalyticsRepository.ts`
- Suffix Fastify plugins with `Routes`: `plateRoutes.ts`, `publicRedirectRoutes.ts`, `authRoutes.ts`
- Suffix HTTP adapters with `Controller`: `PlateController.ts`, `AuthController.ts`
- Suffix Drizzle adapters with `Repository` and a `Drizzle` prefix: `DrizzlePlateRepository.ts`
- Suffix domain services with `UseCase` and a verb: `GetPlatesUseCase.ts`, `CreateBatchPlatesUseCase.ts`, `ResolveRedirectUseCase.ts`
- Suffix frontend data modules with `Service` (camelCase file): `storageService.ts`, `imageComposerService.ts`
- Prefix React hooks with `use`: `usePWAInstall.ts`
- Keep shared domain types in `packages/types/src/index.ts`; re-export from `apps/plateflow-app/src/types.ts` and `apps/plateflow-api/src/core/entities/index.ts`
- Map schema columns in snake_case inside `packages/database/src/schema/index.ts`; map them to camelCase domain fields in repositories

**Functions:**

- Use camelCase for functions and methods: `createFastifyApp()`, `requireAuth()`, `generatePixBrCode()`, `generateVCardString()`, `sanitizeErrorMessage()`
- Expose one public method named `execute` on every use case (`GetPlatesUseCase.execute`, `UpdateRedirectUseCase.execute`); add `executeBatch` only for bulk variants (`DeletePlateUseCase.executeBatch`)
- Name repository methods after collection operations: `findAll`, `findById`, `findBySlug`, `findByIds`, `create`, `createBatch`, `update`, `delete`, `deleteBatch`, `incrementClicks`
- Name controller methods after HTTP intent: `getAll`, `create`, `createBatch`, `update`, `delete`, `deleteBatch`, `login`, `me`
- Prefix boolean helpers and state with `is` / domain flags: `isOpen`, `isLoading`, `isCheckingAuth`, `nfcWritten`
- Prefix event handlers with `on` in props and `handle` in implementations: `onLoginSuccess`, `handleSubmit`, `handleRedirect`

**Variables:**

- Use camelCase for locals and React state: `fetchedPlates`, `activeTab`, `clientRedirectSlug`
- Use SCREAMING_SNAKE_CASE for constant maps: `STORAGE_KEYS` in `apps/plateflow-app/src/services/storageService.ts`
- Prefix generated IDs with a short domain tag: `tmpl-`, `plate-`, `redir-`, `log-` (see `CreateTemplateUseCase.ts`, `CreateBatchPlatesUseCase.ts`, `ResolveRedirectUseCase.ts`)
- Name unused Fastify args with a leading underscore: `_req`, `_request`
- Keep env-derived values explicit: `adminEmail`, `adminPassword`, `PORT`, `DATABASE_URL`

**Types:**

- Use PascalCase interfaces for domain models in `packages/types/src/index.ts`: `PhysicalPlate`, `DynamicRedirect`, `PlateTemplate`, `AnalyticsLog`, `AuthUser`, `BatchGenerationParams`
- Use string-literal unions, not enums: `RedirectType`, `RedirectStatus`, `ButtonVariant`, `ToastType`, `BadgeVariant`
- Name UI prop interfaces `{Component}Props` in the same file: `ButtonProps`, `ModalProps`, `LoginScreenProps`
- Name Drizzle inferred row types `{Entity}Select` / `{Entity}Insert` in `packages/database/src/schema/index.ts`: `PlateSelect`, `RedirectInsert`
- Import types with `import type` in API files: `import type { IPlateRepository } from '...'`

## Code Style

**Formatting:**

- No Prettier, Biome, or EditorConfig file is present
- Use 2-space indentation and trailing commas in multi-line argument lists (`PlateController.ts`, `CreateBatchPlatesUseCase.ts`)
- Keep ESM (`"type": "module"`) in `package.json`, `apps/plateflow-api/package.json`, `apps/plateflow-app/package.json`
- Prefer single quotes in TypeScript/TSX
- Keep Tailwind class strings inline on JSX; compose variants via `Record<Variant, string>` maps in `apps/plateflow-app/src/components/ui/Button.tsx` and `Badge.tsx`

**Linting:**

- Treat `tsc --noEmit` as the linter — that is the `lint` script in `apps/plateflow-api/package.json`, `apps/plateflow-app/package.json`, `packages/database/package.json`, and `packages/types/package.json`
- Run workspace lint via `pnpm lint` (`turbo run lint` in root `package.json`)
- Enable `strict: true` in `apps/plateflow-api/tsconfig.json`, `packages/database/tsconfig.json`, and `packages/types/tsconfig.json`
- Do not introduce ESLint/Prettier unless the phase explicitly adds them
- Avoid unused locals; unused request objects must be `_req`

## Import Organization

**Order:**

1. Side-effect / runtime config first (`import 'dotenv/config'` in `apps/plateflow-api/src/server.ts`)
2. External packages (`fastify`, `react`, `lucide-react`, `drizzle-orm`)
3. Workspace packages (`@plateflow/database`, `@plateflow/types`)
4. Internal layers with relative paths (repositories → use cases → controllers)
5. Type-only imports via `import type` in API code

**Path Aliases:**

- `@/*` maps to `apps/plateflow-app/src/*` in `apps/plateflow-app/tsconfig.json` and `apps/plateflow-app/vite.config.ts`
- Do not use `@/` in existing app source — keep relative imports (`../types`, `./components/ui`)
- API imports MUST use `.js` extensions for local ESM: `from './infrastructure/http/app.js'`, `from '../../../core/use-cases/plates/GetPlatesUseCase.js'`
- App feature files omit extensions; the UI barrel in `apps/plateflow-app/src/components/ui/index.ts` uses `.js` suffixes
- Re-export shared types from `@plateflow/types` only — do not duplicate interfaces in the app or API

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GetPlatesUseCase } from '../../../core/use-cases/plates/GetPlatesUseCase.js';
import type { PhysicalPlate } from '../../../core/entities/index.js';
```

## Error Handling

**Patterns:**

- Throw `Error` with a Portuguese user-facing message from use cases; do not throw custom error classes
- Controllers wrap every handler in `try/catch (err: any)` and return `{ error: err.message || '…' }`
- Map read failures to HTTP 500 and write/validation failures to HTTP 400 (`PlateController.ts`, `RedirectController.ts`, `TemplateController.ts`)
- Map auth failures to HTTP 401 with `{ error: '…' }` (`authMiddleware.ts`, `AuthController.ts`)
- Return HTTP 404 HTML for unknown public slugs in `publicRedirectRoutes.ts`; do not JSON-404 public redirects
- Return HTTP 413 from the global Fastify error handler for `FST_ERR_CTP_BODY_TOO_LARGE` in `apps/plateflow-api/src/infrastructure/http/app.ts`
- Sanitize database messages with `sanitizeErrorMessage()` from `packages/database/src/client.ts` before logging
- Swallow non-critical side effects with `.catch(() => {})` or `.catch((err) => console.error(...))` — never fail a redirect because analytics/clicks failed (`ResolveRedirectUseCase.ts`, `DeletePlateUseCase.ts`)
- On the client, return `{ success: false, error }` from `StorageService.login`; throw `Error` from `saveTemplate` / `deleteTemplate`; fall back to localStorage and `console.warn` for fetch/sync failures

```typescript
async execute(id: string): Promise<PhysicalPlate> {
  const existing = await this.plateRepo.findById(id);
  if (!existing) {
    throw new Error(`Placa com ID "${id}" não encontrada.`);
  }
  const updated = await this.plateRepo.update(id, updates);
  if (!updated) {
    throw new Error(`Falha ao atualizar placa com ID "${id}".`);
  }
  return updated;
}
```

```typescript
async getAll(_req: FastifyRequest, reply: FastifyReply) {
  try {
    const plates = await this.getPlatesUseCase.execute();
    return reply.send(plates);
  } catch (err: any) {
    return reply.status(500).send({ error: err.message || 'Erro ao listar placas.' });
  }
}
```

## Logging

**Framework:** Fastify logger in `createFastifyApp()` plus `console.*`

**Patterns:**

- Disable Fastify request logs when `NODE_ENV === 'test'` (`apps/plateflow-api/src/infrastructure/http/app.ts`)
- Prefix API operational logs with a bracket tag: `[Vercel Handler Error]:`, `[DB Pool Error]:`, `[Seed warning]:`, `[Clicks Increment Error]:`, `[Analytics Log Error]:`, `[Template Seed Warning]:`
- Log startup with `console.log` (`⚡ PlateFlow …`) in `apps/plateflow-api/src/server.ts` and `server.ts`
- Use `console.error` for failures, `console.warn` for degraded/fallback paths, `console.log` for lifecycle
- Write user-visible API `error` strings in Portuguese; mixed EN/PT in `console.*` is existing style — keep new logs tagged and in Portuguese when they describe user impact
- Never log raw `DATABASE_URL` or password substrings — pass messages through `sanitizeErrorMessage()`

## Comments

**When to Comment:**

- Comment non-obvious control flow (batch rollback, CORS image retry, Vite middleware skip of `/api` and `/r/`)
- Use numbered step comments in multi-branch use cases (`CreateBatchPlatesUseCase.ts` branches 1 and 2)
- Use section banners in large service objects (`storageService.ts` AUTHENTICATION / TEMPLATES / REDIRECTS / PLATES)
- Keep JSX section comments in UI (`LoginScreen.tsx`, `Modal.tsx`)
- Do not narrate obvious getters (`return this.plateRepo.findAll()`)

**JSDoc/TSDoc:**

- Add short JSDoc on public methods of object-literal services (`ImageComposerService` in `apps/plateflow-app/src/services/imageComposerService.ts`)
- Skip class-level JSDoc on use cases and controllers — names carry the contract
- `App.tsx` carries an SPDX license header; do not copy that header onto new files unless adding a new app entry

## Function Design

**Size:**

- Keep use cases focused on one action; `Get*UseCase` files stay under ~15 lines (`GetPlatesUseCase.ts`, `GetTemplatesUseCase.ts`)
- Put branching and compensation in the mutating use case (`CreateBatchPlatesUseCase.ts`, `DeletePlateUseCase.ts`)
- Keep controllers as thin HTTP adapters — no SQL, no Drizzle, no HTML
- Extract HTML landing pages for public redirects into the route handler (`publicRedirectRoutes.ts`), not into use cases
- Split UI primitives (`apps/plateflow-app/src/components/ui/`) from feature screens (`LoginScreen.tsx`, `PlatesInventory.tsx`)

**Parameters:**

- Inject collaborators through the constructor (use cases, controllers) — do not import concrete repositories inside a use case
- Accept domain types (`PhysicalPlate`, `Partial<DynamicRedirect>`) or a documented union (`CreateBatchInput`) rather than raw Fastify requests inside use cases
- Type Fastify generics on controllers: `FastifyRequest<{ Params: { id: string }; Body: any }>`
- Prefer optional metadata bags for side inputs: `logMeta?: Partial<AnalyticsLog>` in `ResolveRedirectUseCase.execute`

**Return Values:**

- Return domain objects or `null` from repositories (`findById`, `findBySlug`, `update`)
- Return the mutated entity from write use cases; return `{ plates, redirects }` from batch create; return `{ count }` from batch delete
- Return `{ success: true, message }` JSON for successful deletes (`PlateController.delete`, `TemplateController.delete`)
- Return raw arrays for list endpoints (`reply.send(plates)`)
- Return `Promise<boolean>` from `delete` repository methods (`true` when a row was removed)

## Module Design

**Exports:**

- Use named exports for almost everything: classes, hooks, UI components, route plugins, helpers
- Default-export only the React app root (`apps/plateflow-app/src/App.tsx`) and the Vercel handler (`apps/plateflow-api/src/server.ts`)
- Export Fastify plugins as `const {name}Routes: FastifyPluginAsync`
- Export frontend services as object literals (`StorageService`, `ImageComposerService`), not classes
- Export API domain helpers as named functions (`generatePixBrCode`, `generateVCardString`)
- Set `displayName` on `forwardRef` components (`Input`, `Select`)

**Barrel Files:**

- Re-export UI primitives from `apps/plateflow-app/src/components/ui/index.ts`
- Re-export domain types from `packages/types/src/index.ts` and `apps/plateflow-api/src/core/entities/index.ts`
- Re-export Drizzle client + schema + orm helpers from `packages/database/src/index.ts`
- Do not add barrels for use cases, controllers, or feature components — import the file directly

## Layering Rules (write new code this way)

**API (`apps/plateflow-api/src/`):**

1. Put domain types in `@plateflow/types` (re-export via `core/entities/index.ts`)
2. Put ports in `core/repositories/I*.ts`
3. Put application logic in `core/use-cases/{domain}/{Verb}{Noun}UseCase.ts`
4. Put Drizzle mapping in `infrastructure/database/Drizzle{Noun}Repository.ts`
5. Put HTTP in `infrastructure/http/controllers` + `routes`
6. Wire a new `Drizzle*Repository` + use case + controller inside the route plugin (see `plateRoutes.ts`)
7. Register the plugin with a `/api/{resource}` prefix in `infrastructure/http/app.ts`

**App (`apps/plateflow-app/src/`):**

1. Put screens/modals in `components/`
2. Put reusable primitives in `components/ui/` and export them from the barrel
3. Put browser/API persistence in `services/storageService.ts`
4. Put canvas/QR/ZIP work in `services/imageComposerService.ts`
5. Put reusable React state in `hooks/`
6. Keep `App.tsx` as the state owner — no Redux/Zustand

**Database (`packages/database/src/`):**

- Define tables in `schema/index.ts` with snake_case SQL columns
- Map to camelCase only in API repositories
- Load env via `client.ts`; never read `.env` files in application code

## React / UI Conventions

- Use function components typed as `React.FC<Props>`
- Colocate the props interface in the component file
- Use Tailwind utility classes; zinc palette for chrome, rose for danger, amber for virgin/paused, emerald for Pix/success
- Use `lucide-react` icons at `h-4 w-4` unless a brand mark needs a larger box
- Mark dialogs with `role="dialog"` + `aria-modal="true"` (`Modal.tsx`); close buttons need `aria-label`
- Bind inputs with `htmlFor` / `useId()` (`Input.tsx`)
- Keep user-facing copy in Portuguese (`pt-BR`)

## ID, Date, and Persistence Conventions

- Persist timestamps as ISO strings in the domain (`createdAt`, `updatedAt`); convert `Date` ↔ ISO at the repository boundary
- Generate IDs as `` `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` `` or batch-structured `` `plate-${batch}-${pad}-${suffix}` ``
- Compare slugs case-insensitively on the client (`slug.toLowerCase()`)
- Keep localStorage keys versioned: `nfc_qr_*_v2` in `STORAGE_KEYS`
- Send `Authorization: Bearer <token>` from `getAuthHeader()`; accept `Bearer` or `x-auth-token` on the API

---

*Convention analysis: 2026-09-20*
