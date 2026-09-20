---
last_mapped_commit: 05d7e8c0cd75d9708d937e833856f04c7c7afdd1
last_mapped_at: 2026-09-20
---
# Codebase Concerns

**Analysis Date:** 2026-09-20

## Tech Debt

**Mock admin auth treated as production session:**

- Issue: Login issues a prefix-guessable token (`mock_token_admin_${Date.now()}`) and every write guard only checks that prefix. Comments in the UI still say "Supabase Login" while no Supabase Auth client exists.
- Files: `apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts`, `apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts`, `apps/plateflow-app/src/App.tsx`, `apps/plateflow-app/src/services/storageService.ts`
- Impact: Anyone who can call `/api/auth/login` or forge a `Authorization: Bearer mock_token_admin_*` header can mutate plates, redirects, and templates. `JWT_SECRET` is declared in `turbo.json` but never read.
- Fix approach: Replace mock tokens with signed JWTs (or Supabase Auth) verified in `requireAuth`. Remove hardcoded default `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Fail boot if those env vars are missing in production.

**localStorage as write-ahead cache (split-brain):**

- Issue: `StorageService` updates `localStorage` first (or always) and treats server `fetch` as fire-and-forget. Failed or 4xx responses still leave the UI showing success. Comment above `generateBatch` claims an "ATOMIC SUPABASE TRANSACTION" that does not exist.
- Files: `apps/plateflow-app/src/services/storageService.ts`
- Impact: Admin UI diverges from Postgres. Deletes, NFC flags, redirect edits, and batches can appear saved while the database is unchanged. Next `loadDataFromBackend` either overwrites or, on fetch failure, keeps the lie.
- Fix approach: Make the server the source of truth. Await `res.ok`, throw on failure, only then update local cache. Remove silent `catch` paths in `saveRedirect`, `savePlate`, `deletePlate`, `bulkDeletePlates`, and `generateBatch`.

**Three batch-generation implementations:**

- Issue: Slug/plate construction is duplicated in the modal, the client service, and the API use case, with different numbering and ID rules.
- Files: `apps/plateflow-app/src/components/BatchGeneratorModal.tsx`, `apps/plateflow-app/src/services/storageService.ts`, `apps/plateflow-api/src/core/use-cases/plates/CreateBatchPlatesUseCase.ts`, `apps/plateflow-app/src/App.tsx`
- Impact: `BatchGeneratorModal` honors `startNumber`; `CreateBatchPlatesUseCase` path 2 always starts at `01`. `App.tsx` `handleBatchCreated` posts to `/api/plates/batch` again after the modal already built entities. Slug format `prefix-NN` collides across lots.
- Fix approach: Keep a single server-side generator. Client sends `{ templateId, batchIdentifier, quantity, prefix, startNumber }`. Delete client-side slug minting and the unused `StorageService.generateBatch` path.

**God components / no routing:**

- Issue: The SPA is one `App.tsx` with auth, public `/r/:slug` fallback, dashboard tabs, and toast wiring. Inventory and templates are 500–800 line files.
- Files: `apps/plateflow-app/src/App.tsx`, `apps/plateflow-app/src/components/PlatesInventory.tsx`, `apps/plateflow-app/src/components/TemplateManager.tsx`
- Impact: Any inventory, auth, or redirect change risks regressions in unrelated tabs. Public scan UX is reimplemented in the admin bundle.
- Fix approach: Extract `/r/:slug` out of the admin app (server-only). Split tabs into route-level pages. Keep `App.tsx` as shell + auth gate only.

**Dual HTTP entry points and leftover root stack:**

- Issue: Root `server.ts` embeds Vite into Fastify; `apps/plateflow-api/src/server.ts` also listens and exposes a Vercel `handler` that `app.inject`s every request. Root `package.json` still depends on `express`, `@types/express`, `@google/genai`, `@supabase/supabase-js`, and `drizzle-orm` with zero imports.
- Files: `server.ts`, `apps/plateflow-api/src/server.ts`, `api/index.ts`, `package.json`, `vercel.json`
- Impact: Two listen paths, two production stories (`tsx server.ts` vs `api/index.ts` → `apps/plateflow-api/dist/server.js`). Dead dependencies inflate install surface and confuse which auth/DB client is real.
- Fix approach: One entry for local (Fastify + Vite middleware) and one compiled serverless handler. Delete unused root packages. Do not run production via `tsx`.

**Schema without relations or versioned migrations:**

- Issue: `plates.template_id`, `plates.slug`, `redirects.plate_id`, and `analytics.redirect_slug` have no foreign keys. There is no `packages/database/drizzle/` migration directory; only `drizzle-kit push` / `seedDefaultTemplates` exist.
- Files: `packages/database/src/schema/index.ts`, `packages/database/src/client.ts`, `packages/database/src/migrate.ts`, `packages/database/drizzle.config.ts`
- Impact: Orphan plates after template delete; analytics rows survive slug reuse; environments drift because schema is push-only.
- Fix approach: Add FKs (or explicit ON DELETE rules), unique `plates.slug` if upserts stay slug-keyed, and committed SQL migrations from `drizzle-kit generate`.

**Dead UI and seed duplicates:**

- Issue: `LoginModal` is never imported (`LoginScreen` is the gate). `apps/plateflow-app/src/data/initialData.ts` duplicates SVG templates already seeded in `packages/database/src/client.ts`.
- Files: `apps/plateflow-app/src/components/LoginModal.tsx`, `apps/plateflow-app/src/data/initialData.ts`, `packages/database/src/client.ts`
- Impact: Two login UIs and two default-template sources will diverge.
- Fix approach: Delete unused files. Keep seed only in `@plateflow/database`.

## Known Bugs

**Forgeable admin token (auth bypass):**

- Symptoms: Any request with `Authorization: Bearer mock_token_admin_<anything>` or `x-auth-token` with the same prefix passes `requireAuth` and `/api/auth/me`.
- Files: `apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts`, `apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts`
- Trigger: Call a mutating route (`PUT /api/redirects/:slug`, `POST /api/plates/batch`, `DELETE /api/templates/:id`) with a guessed prefix.
- Workaround: Network isolation only. Do not expose the API on a public host until real tokens exist.

**Default credentials compiled into the binary:**

- Symptoms: If `ADMIN_EMAIL` / `ADMIN_PASSWORD` are unset, login accepts `admin@plateflow.com` / `plateflow2026`.
- Files: `apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts`
- Trigger: Deploy without those env vars (easy: they are optional).
- Workaround: Always set strong env credentials. Still replace the fallback — it ships in source.

**`onConflictDoUpdate` on `plates.slug` without a unique constraint:**

- Symptoms: Batch upsert targets `plates.slug`, but `plates.slug` is only `notNull()` (unique exists on `redirects.slug` only). Postgres rejects `ON CONFLICT (slug)` when no matching unique/exclusion constraint exists.
- Files: `apps/plateflow-api/src/infrastructure/database/DrizzlePlateRepository.ts`, `packages/database/src/schema/index.ts`
- Trigger: `POST /api/plates/batch` when a slug already exists, or any insert that hits the conflict clause.
- Workaround: Use unique slugs. Fix: add `.unique()` on `plates.slug` or conflict on `plates.id`.

**Slug collisions across batches:**

- Symptoms: Second lot with prefix `placa` regenerates `placa-01`… and upserts/overwrites the first lot's redirects (redirects conflict on slug) or fails plates upsert (see above).
- Files: `apps/plateflow-app/src/components/BatchGeneratorModal.tsx`, `apps/plateflow-api/src/core/use-cases/plates/CreateBatchPlatesUseCase.ts`, `apps/plateflow-app/src/services/storageService.ts`
- Trigger: Generate two lots with the same prefix (default `placa`).
- Workaround: Change prefix per lot. Fix: include batch id in the slug (`{batch}-{n}-{rand}`) and enforce uniqueness server-side.

**Client analytics POST has no route:**

- Symptoms: `StorageService.recordClick` `POST`s `/api/analytics`. `analyticsRoutes` only registers `GET /`.
- Files: `apps/plateflow-app/src/services/storageService.ts`, `apps/plateflow-api/src/infrastructure/http/routes/analyticsRoutes.ts`
- Trigger: SPA `/r/:slug` path or simulator `handleRecordScan`.
- Workaround: Real scans go through `ResolveRedirectUseCase` (server logs). Simulator/client clicks are dropped.

**Public `/r/:slug` fallback in the SPA uses localStorage:**

- Symptoms: If the request is not rewritten to Fastify (misconfigured host, preview without `vercel.json` rewrites, opening the Vite app alone), `App.tsx` resolves the slug via `StorageService.getRedirectBySlug`. Public visitors have empty cache → "Placa Não Encontrada" even when the row exists.
- Files: `apps/plateflow-app/src/App.tsx`, `apps/plateflow-app/src/services/storageService.ts`, `apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts`
- Trigger: Hit `/r/:slug` on a host that serves `index.html` for all paths.
- Workaround: Keep `vercel.json` and `server.ts` `/r/` exclusions intact. Fix: remove the SPA redirect branch; always resolve on the server.

**Case-sensitive slug lookup on the API:**

- Symptoms: Client compares slugs with `.toLowerCase()`. `DrizzleRedirectRepository.findBySlug` uses exact `eq(redirects.slug, slug)`.
- Files: `apps/plateflow-api/src/infrastructure/database/DrizzleRedirectRepository.ts`, `apps/plateflow-app/src/services/storageService.ts`
- Trigger: NFC/QR payload or typed URL differs in case from the stored slug.
- Workaround: Always store and print lowercase slugs. Fix: normalize slug to lowercase in the repository.

**Mutations ignore HTTP status:**

- Symptoms: `saveRedirect` / `savePlate` / `deletePlate` / `generateBatch` do not check `res.ok`. A 401/400 still updates local state and returns success to the UI.
- Files: `apps/plateflow-app/src/services/storageService.ts`
- Trigger: Expired/forged token, validation error, or offline after the request starts.
- Workaround: Refresh the page after a failed network tab entry. Fix: throw unless `res.ok`.

**Error handler and health leak internals:**

- Symptoms: Fastify `setErrorHandler` does `reply.send(error)` for non-413 errors (stack/message to client). `/api/health` returns raw `err.message` without `sanitizeErrorMessage`.
- Files: `apps/plateflow-api/src/infrastructure/http/app.ts`, `packages/database/src/client.ts`
- Trigger: DB down or unhandled exception.
- Workaround: None for clients. Fix: map to generic 500; sanitize health errors the same way as `migrate.ts`.

**Batch persist is not a transaction:**

- Symptoms: Redirects insert first, plates second; rollback is a best-effort `deleteBatchBySlugs`. Delete plate then redirect is the same two-step. `CreateBatchPlatesUseCase` injects `templateRepo` and never uses it — invalid `templateId` still inserts.
- Files: `apps/plateflow-api/src/core/use-cases/plates/CreateBatchPlatesUseCase.ts`, `apps/plateflow-api/src/core/use-cases/plates/DeletePlateUseCase.ts`
- Trigger: Failure after redirects commit; deleting a template still referenced by plates.
- Workaround: Manual DB cleanup. Fix: `db.transaction(...)` and validate template existence.

## Security Considerations

**Unauthenticated inventory and analytics dumps:**

- Risk: `GET /api/plates`, `GET /api/redirects`, `GET /api/templates`, and `GET /api/analytics` have no `requireAuth`. Analytics rows include `ip`, `user_agent`, and `referrer`.
- Files: `apps/plateflow-api/src/infrastructure/http/routes/plateRoutes.ts`, `apps/plateflow-api/src/infrastructure/http/routes/redirectRoutes.ts`, `apps/plateflow-api/src/infrastructure/http/routes/templateRoutes.ts`, `apps/plateflow-api/src/infrastructure/http/routes/analyticsRoutes.ts`, `packages/database/src/schema/index.ts`
- Current mitigation: None on read paths. Writes use the forgeable mock token.
- Recommendations: Require auth on all admin GETs. Do not return raw IPs to the browser. Treat this as a LGPD exposure if the API is public.

**Open redirect / dangerous schemes:**

- Risk: `ensureAbsoluteUrl` accepts any `scheme:` URI. `javascript:`, `data:`, and `file:` pass and become `307` targets.
- Files: `apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts`
- Current mitigation: None. Destination is operator-controlled but an admin XSS or stolen session can plant a payload that every scan follows.
- Recommendations: Allowlist `http:` / `https:` (plus `https://wa.me/` for WhatsApp). Reject other schemes.

**Stored XSS in public HTML pages:**

- Risk: `slug`, `title`, Pix key/name, and vCard fields are interpolated into HTML strings with no escaping.
- Files: `apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts`
- Current mitigation: None.
- Recommendations: Escape HTML (`&`, `<`, `>`, `"`, `'`) or render via a template engine. Do not concatenate user metadata into markup.

**CORS reflects any origin:**

- Risk: `origin: true` + `credentials: true` lets a hostile site send the victim's `Authorization` header to the API.
- Files: `apps/plateflow-api/src/infrastructure/http/app.ts`
- Current mitigation: None.
- Recommendations: Allowlist the production app origin(s). Disable credentialed CORS for public `/r/` routes.

**TLS verification disabled for remote Postgres:**

- Risk: `ssl: { rejectUnauthorized: false }` for every non-localhost `DATABASE_URL`.
- Files: `packages/database/src/client.ts`
- Current mitigation: Connection string password redaction in `sanitizeErrorMessage` (logs only).
- Recommendations: Use the provider CA. Keep `rejectUnauthorized: false` only for local/dev.

**Hardcoded Supabase pooler region and default DB URL:**

- Risk: Direct `db.<ref>.supabase.co` URLs are rewritten to `aws-0-sa-east-1.pooler.supabase.com`. Wrong region = connection failure. Missing `DATABASE_URL` falls back to `postgresql://postgres:postgres@localhost:5432/postgres`.
- Files: `packages/database/src/client.ts`
- Current mitigation: `.env.example` exists (environment configuration; do not copy secrets into docs).
- Recommendations: Require `DATABASE_URL` at boot. Prefer `SUPABASE_POOLER_URL` instead of regex rewrite.

**No rate limit, no body allowlist, 10MB global body:**

- Risk: Login is brute-forceable (especially with default password). Template POST allows 10MB; Fastify `bodyLimit` is 10MB on the whole app. Public `/r/:slug` can be hammered to inflate `analytics` and `clicks`.
- Files: `apps/plateflow-api/src/infrastructure/http/app.ts`, `apps/plateflow-api/src/infrastructure/http/routes/templateRoutes.ts`, `apps/plateflow-api/src/infrastructure/http/routes/authRoutes.ts`
- Current mitigation: None (`helmet`, rate-limit, and schema validators are not in the tree).
- Recommendations: Add `@fastify/rate-limit` on `/api/auth/login` and `/r/:slug`. Validate bodies with Zod. Store template images in object storage, not `text` columns.

**Trust-proxy IP spoofing:**

- Risk: `trustProxy: true` plus `x-forwarded-for` first hop is stored on every scan.
- Files: `apps/plateflow-api/src/infrastructure/http/app.ts`, `apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts`, `apps/plateflow-api/src/core/use-cases/redirects/ResolveRedirectUseCase.ts`
- Current mitigation: None.
- Recommendations: Use Fastify's `request.ip` after configuring trusted hop count. Hash or truncate IPs if retained.

## Performance Bottlenecks

**Unbounded admin list endpoints:**

- Problem: `findAll` on plates, redirects, and templates loads every row, ordered in memory, on every dashboard sync (`Promise.all` of four GETs).
- Files: `apps/plateflow-api/src/infrastructure/database/DrizzlePlateRepository.ts`, `apps/plateflow-api/src/infrastructure/database/DrizzleRedirectRepository.ts`, `apps/plateflow-app/src/App.tsx`
- Cause: No pagination, no indexes on `plates.slug` / `plates.batch_identifier` / `analytics.redirect_slug`.
- Improvement path: Cursor/limit pagination. Index slug and batch. Do not refetch all four collections after every NFC toggle.

**Analytics hard-capped at 200 rows:**

- Problem: Dashboard device breakdown and recent activity only see the latest 200 events.
- Files: `apps/plateflow-api/src/core/use-cases/analytics/GetAnalyticsUseCase.ts`, `apps/plateflow-api/src/infrastructure/database/DrizzleAnalyticsRepository.ts`, `apps/plateflow-app/src/services/storageService.ts`
- Cause: `findAll(limit = 200)` with no aggregates.
- Improvement path: SQL `GROUP BY device_type` / daily counts. Keep a rolling raw-event table with indexes.

**Template backgrounds as data-URI text in Postgres:**

- Problem: Default seeds and uploads store full SVG/PNG data URLs in `templates.background_url`. Template POST body limit is 10MB.
- Files: `packages/database/src/schema/index.ts`, `packages/database/src/client.ts`, `apps/plateflow-app/src/data/initialData.ts`, `apps/plateflow-api/src/infrastructure/http/routes/templateRoutes.ts`
- Cause: Image-as-column instead of object storage.
- Improvement path: Store files in S3/Supabase Storage; persist URL + dimensions only.

**Client-side ZIP / canvas composition:**

- Problem: Batch art is rendered in the browser (`imageComposerService` + JSZip) inside `BatchGeneratorModal` / `PlatesInventory`. Large lots freeze the tab.
- Files: `apps/plateflow-app/src/services/imageComposerService.ts`, `apps/plateflow-app/src/components/BatchGeneratorModal.tsx`, `apps/plateflow-app/src/components/PlatesInventory.tsx`
- Cause: Per-plate canvas work on the main thread; no quantity cap in the API use case.
- Improvement path: Cap quantity (e.g. 50). Move compose/ZIP to a worker or server job.

**Serverless pool + Fastify inject:**

- Problem: Module-level `pg.Pool` (`max: 10`) plus `app.inject` on every Vercel request. Cold start still constructs Fastify + pool.
- Files: `packages/database/src/client.ts`, `apps/plateflow-api/src/server.ts`, `api/index.ts`
- Cause: Node pg pool is not designed for many concurrent serverless isolates against Supabase session limits.
- Improvement path: Use the transaction pooler URL, `max: 1` on Vercel, or `@vercel/postgres` / `postgres.js` with prepare disabled.

**Public pages pull Tailwind from a CDN:**

- Problem: Every 404/virgin/Pix/vCard HTML page loads `https://cdn.tailwindcss.com` at request time.
- Files: `apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts`
- Cause: Inline HTML instead of a static template.
- Improvement path: Inline a few CSS rules or a built asset. Do not depend on the Tailwind Play CDN in production.

## Fragile Areas

**Vercel rewrite → inject adapter:**

- Files: `vercel.json`, `api/index.ts`, `apps/plateflow-api/src/server.ts`
- Why fragile: `__route` query rewriting, `content-length` stripping, and JSON re-stringify of `req.body` diverge from local `app.listen`. Multipart/binary template uploads can break only on Vercel.
- Safe modification: Change public routes only after exercising both `tsx server.ts` and the compiled `handler`. Add a contract test that `inject`s `/r/:slug` and `/api/health`.
- Test coverage: None.

**Vite-in-Fastify middleware (`onRequest`):**

- Files: `server.ts`
- Why fragile: Non-`/api` and non-`/r/` traffic is handed to Vite via `req.raw` / `reply.raw`. A missing `reply.hijack()` / early return can double-send. Production `setNotFoundHandler` reads `dist/index.html` synchronously on every SPA miss.
- Safe modification: Do not add new top-level prefixes without updating both the Vite skip list and `vercel.json`.
- Test coverage: None.

**Redirect type switch in one 220-line handler:**

- Files: `apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts`
- Why fragile: Pix, vCard, WhatsApp, social, and URL share one try/catch. A Pix QR failure returns 500 for all types. HTML is copy-pasted five times.
- Safe modification: Extract one renderer per `redirect.type` with a shared escape helper. Keep `ResolveRedirectUseCase` as the only write path for clicks.
- Test coverage: None — Pix CRC and vCard output are untested.

**Click increment is fire-and-forget:**

- Files: `apps/plateflow-api/src/core/use-cases/redirects/ResolveRedirectUseCase.ts`, `apps/plateflow-api/src/infrastructure/database/DrizzleRedirectRepository.ts`
- Why fragile: `incrementClicks` and `analytics.create` are not awaited. Isolate teardown on Vercel can drop the write. IDs use `Date.now()` + `Math.random()`.
- Safe modification: Await both writes, or enqueue. Use `crypto.randomUUID()`.
- Test coverage: None.

**Auth session restore on network error:**

- Files: `apps/plateflow-app/src/services/storageService.ts`
- Why fragile: `verifyAuth` returns the cached `AUTH_USER` when `/api/auth/me` throws (offline). Combined with mock tokens, the admin shell stays open without a live session.
- Safe modification: On network error, keep read-only cached data but do not treat the user as verified for mutations. On 401, `logout()`.
- Test coverage: None.

## Scaling Limits

**Postgres pool:**

- Current capacity: `max: 10` connections per isolate in `packages/database/src/client.ts`.
- Limit: Multiple Vercel isolates × 10 plus Supabase pooler `6543` limits exhaust connections; local default URL has no SSL and a single `postgres` DB.
- Scaling path: `max: 1` on serverless, explicit pooler URL, connection reuse via Fastify plugin (do not create a new `drizzle(getPool())` story per request).

**Admin payload size:**

- Current capacity: Full table dumps on each `loadDataFromBackend`. Analytics list capped at 200.
- Limit: localStorage quota (~5MB) for plates + templates with data-URI backgrounds. Dashboard stats (`StorageService.getStats`) scan all cached arrays on every render of `App.tsx`.
- Scaling path: Paginate APIs; compute stats in SQL; stop storing full template images in `localStorage`.

**Batch quantity:**

- Current capacity: UI default 10 in `BatchGeneratorModal.tsx`; API path 2 accepts any `quantity >= 1` with no max.
- Limit: Unbounded insert + client ZIP will OOM the browser and lock the table.
- Scaling path: Enforce `quantity <= 50` (or similar) in `CreateBatchPlatesUseCase` and the modal.

**Public scan write amplification:**

- Current capacity: One `UPDATE redirects` + one `INSERT analytics` per scan, unthrottled.
- Limit: Bot traffic grows `analytics` without indexes or retention.
- Scaling path: Rate-limit by IP+slug; retain N days; aggregate then drop raw rows.

## Dependencies at Risk

**Unused root packages (`express`, `@google/genai`, `@supabase/supabase-js`, `drizzle-orm`):**

- Risk: Imply a stack that is not in `apps/` or `packages/`. `@supabase/supabase-js` is unused while comments still say Supabase Auth. `express` is unused while Fastify is the server.
- Impact: Security advisories on unused packages still force upgrades. New code may import the wrong client.
- Migration plan: Remove from root `package.json`. If Gemini or Supabase Auth are needed later, add them in the package that calls them.

**`@types/jszip` at the repo root:**

- Risk: DefinitelyTyped package is obsolete (`jszip` ships its own types). It lives on the root app that does not import `jszip` (the app package does).
- Impact: Duplicate/conflicting types.
- Migration plan: Delete root `@types/jszip`; keep `jszip` only in `apps/plateflow-app/package.json`.

**Production start via `tsx`:**

- Risk: `"start": "NODE_ENV=production tsx server.ts"` in root `package.json` runs TypeScript at runtime. Vercel instead imports compiled `apps/plateflow-api/dist/server.js`.
- Impact: Local/prod behavior skew; `tsx` in prod is slower and a larger attack surface.
- Migration plan: Compile Fastify + static `dist/` and `node` the output. Keep `tsx` for `dev` only.

**No ESLint / Prettier / test runner:**

- Risk: `lint` is `tsc --noEmit` only. No `eslint.config.*`, `.prettierrc*`, `vitest.config.*`, or `.github/` workflows.
- Impact: `as any` and unchecked `req.body` spread unchecked. CI cannot catch the auth/slug bugs above.
- Migration plan: Add Vitest + a small Fastify inject suite first; then ESLint (`no-explicit-any` on `apps/plateflow-api`).

**Tailwind CDN and React 19 without a test harness:**

- Risk: Public pages depend on an external script. App uses React 19 + Vite 6 with zero component tests.
- Impact: CDN outage styles public Pix/vCard pages as unstyled HTML; upgrades land untested.
- Migration plan: Inline CSS for public pages; add Vitest + Testing Library for `StorageService` and login.

## Missing Critical Features

**Signed authentication and session expiry:**

- Problem: No JWT/session expiry, logout is localStorage-only, no CSRF story, no password hashing.
- Blocks: Safe public deploy, multi-user gráfica operators, audit of who changed a redirect.

**Request validation and typed errors:**

- Problem: Controllers take `Body: any` and pass `req.body as any` into use cases. No Zod/Valibot.
- Blocks: Safe batch/template payloads; consistent 400 vs 500; OpenAPI.

**Multi-tenant / RBAC:**

- Problem: Single shared admin. All plates and analytics are global.
- Blocks: More than one customer/operator without leaking inventory and IPs.

**Observability:**

- Problem: `console.log` / `console.error` only. No request id, no error tracker.
- Blocks: Diagnosing dropped click increments and Vercel inject 500s.

**CI and automated tests:**

- Problem: No `.github/workflows`, no `*.test.*` / `*.spec.*` under `apps/` or `packages/`.
- Blocks: Refactors of auth, batch, and `/r/:slug` without manual regression.

**Versioned database migrations:**

- Problem: `packages/database` has `db:push` / a TS "migrate" that only seeds and `SELECT`s.
- Blocks: Repeatable deploys and adding FKs/indexes without hand-editing production.

## Test Coverage Gaps

**Entire API surface:**

- What's not tested: Auth login/me/requireAuth, batch create/rollback, redirect resolve (url/pix/vcard/whatsapp/social/virgin/paused/404), plate delete cascade, template CRUD, analytics list.
- Files: `apps/plateflow-api/src/infrastructure/http/**`, `apps/plateflow-api/src/core/use-cases/**`
- Risk: Auth bypass and slug collision ship unnoticed.
- Priority: High

**Client persistence and optimistic writes:**

- What's not tested: `res.ok` handling, localStorage fallback, dual token keys (`nfc_qr_auth_token_v2` vs `plateflow_auth_token`), `recordClick` POST to a missing route.
- Files: `apps/plateflow-app/src/services/storageService.ts`, `apps/plateflow-app/src/App.tsx`
- Risk: UI reports success on 401; public SPA fallback shows wrong plate state.
- Priority: High

**Pix EMV payload and vCard output:**

- What's not tested: CRC, field lengths, amount formatting, phone sanitization.
- Files: `apps/plateflow-api/src/infrastructure/services/PixCodeService.ts`, `apps/plateflow-api/src/infrastructure/services/VCardService.ts`
- Risk: Invalid BR codes at the point of payment.
- Priority: High

**Database adapter upserts and pooler rewrite:**

- What's not tested: `onConflictDoUpdate` targets vs actual unique indexes; `getDatabaseUrl` region rewrite; SSL flags.
- Files: `packages/database/src/client.ts`, `apps/plateflow-api/src/infrastructure/database/DrizzlePlateRepository.ts`
- Risk: Batch insert fails only against a real Postgres.
- Priority: Medium

**UI flows (inventory, NFC, ZIP export):**

- What's not tested: `PlatesInventory` bulk ZIP/delete, `NfcAssistantModal` Web NFC, `BatchGeneratorModal` progress, `LoginScreen`.
- Files: `apps/plateflow-app/src/components/PlatesInventory.tsx`, `apps/plateflow-app/src/components/NfcAssistantModal.tsx`, `apps/plateflow-app/src/components/BatchGeneratorModal.tsx`, `apps/plateflow-app/src/components/LoginScreen.tsx`
- Risk: Export/delete regressions; NFC mark-written desync.
- Priority: Medium

**E2E scan path:**

- What's not tested: `GET /r/:slug` through `vercel.json` rewrites and through `server.ts` Vite skip.
- Files: `vercel.json`, `server.ts`, `apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts`
- Risk: Production-only 404s for physical plates.
- Priority: High

---

*Concerns audit: 2026-09-20*
