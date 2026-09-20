---
last_mapped_commit: 05d7e8c0cd75d9708d937e833856f04c7c7afdd1
last_mapped_at: 2026-09-20
---
# Technology Stack

**Analysis Date:** 2026-09-20

## Languages

**Primary:**

- TypeScript ~5.8.2 — entire monorepo (`package.json`, `apps/plateflow-app/package.json`, `apps/plateflow-api/package.json`, `packages/database/package.json`, `packages/types/package.json`). Compile target is `ES2022` in `tsconfig.json`, `apps/plateflow-app/tsconfig.json`, `apps/plateflow-api/tsconfig.json`, `packages/database/tsconfig.json`, and `packages/tsconfig/base.json`.
- TSX (React 19 JSX) — frontend UI under `apps/plateflow-app/src/` (`main.tsx`, `App.tsx`, components).

**Secondary:**

- SQL (PostgreSQL dialect via Drizzle) — schema in `packages/database/src/schema/index.ts`; kit config in `packages/database/drizzle.config.ts`.
- CSS (Tailwind v4) — `apps/plateflow-app/src/index.css` uses `@import "tailwindcss"`.
- HTML — Vite entry `apps/plateflow-app/index.html`; server-rendered redirect/Pix/vCard pages in `apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts`.
- JSON — workspace/app metadata in `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `vercel.json`, `metadata.json`, `apps/plateflow-app/public/manifest.json`.

## Runtime

**Environment:**

- Node.js 22 (types pin `@types/node` `^22.14.0` in root `package.json`, `apps/plateflow-api/package.json`, `apps/plateflow-app/package.json`, `packages/database/package.json`). No `.nvmrc` / `.node-version` / `engines` field — treat Node 22 as the supported runtime.
- ESM everywhere: `"type": "module"` in root `package.json`, `apps/plateflow-app/package.json`, `apps/plateflow-api/package.json`, `packages/database/package.json`, `packages/types/package.json`.
- Dev/prod unified process: `tsx server.ts` (root `package.json` scripts `dev` / `start`). Production API bundle is Node ESM via esbuild (`apps/plateflow-api/package.json` `build` script).
- Browser runtime for the PWA: modern Chromium/Safari (Web NFC `NDEFReader` in `apps/plateflow-app/src/components/NfcAssistantModal.tsx`; Canvas + `beforeinstallprompt` in `apps/plateflow-app/src/hooks/usePWAInstall.ts`).

**Package Manager:**

- pnpm `11.9.0` — `"packageManager": "pnpm@11.9.0"` in root `package.json`.
- Lockfile: present — `pnpm-lock.yaml`.
- Workspace: `pnpm-workspace.yaml` includes `packages/*` and `apps/*`. `allowBuilds` permits native builds for `@google/genai`, `esbuild`, `protobufjs`.
- `.npmrc` file present — package-manager config only; do not read or quote contents.

## Frameworks

**Core:**

- React `^19.0.1` + `react-dom` `^19.0.1` — SPA in `apps/plateflow-app/src/main.tsx`.
- Fastify `^5.2.1` — HTTP API in `apps/plateflow-api/src/infrastructure/http/app.ts`. Plugins: `@fastify/cors` `^10.0.1`, `@fastify/formbody` `^8.0.1`.
- Vite `^6.2.3` + `@vitejs/plugin-react` `^5.0.4` — frontend bundler (`apps/plateflow-app/vite.config.ts`). Root `server.ts` mounts Vite in middleware mode during non-production.
- Drizzle ORM `^0.45.2` + `drizzle-kit` `^0.31.10` — typed PostgreSQL access (`packages/database/src/client.ts`, `packages/database/drizzle.config.ts`).
- Tailwind CSS `^4.1.14` + `@tailwindcss/vite` `^4.1.14` — utility CSS (`apps/plateflow-app/vite.config.ts`, `apps/plateflow-app/src/index.css`).

**Testing:**

- Not detected — no Jest/Vitest/Playwright config, no `*.test.*` / `*.spec.*` files. `lint` is `tsc --noEmit` (`apps/plateflow-app/package.json`, `apps/plateflow-api/package.json`). Fastify logger is disabled when `NODE_ENV === 'test'` in `apps/plateflow-api/src/infrastructure/http/app.ts` — prepare for a future test runner, do not add Jest unless the project adopts it.

**Build/Dev:**

- Turbo `^2.10.12` — monorepo task runner (`turbo.json`). Tasks: `build`, `lint`, `dev`, `clean`.
- tsx `^4.21.0` — TypeScript execute/watch (`package.json` `dev`/`start`; `apps/plateflow-api` `dev` uses `tsx watch src/server.ts`).
- esbuild `^0.25.0` — API production bundle (`apps/plateflow-api/package.json` `build`: ESM, `--platform=node`, externals `pg`, `fastify`, `@fastify/*`, `qrcode`, `dotenv`).
- dotenv `^17.2.3` — env loading (`server.ts`, `apps/plateflow-api/src/server.ts`, `packages/database/src/client.ts`).
- autoprefixer `^10.4.21` — root `devDependencies` only; Tailwind v4 is driven by the Vite plugin.

## Key Dependencies

**Critical:**

- `pg` `^8.23.0` — PostgreSQL driver. Use `getPool()` / `db` from `packages/database/src/client.ts`; do not instantiate a second pool.
- `drizzle-orm` `^0.45.2` — query layer over `pg`. Schema tables: `templates`, `redirects`, `plates`, `analytics` in `packages/database/src/schema/index.ts`.
- `fastify` `^5.2.1` — register routes on `createFastifyApp()` in `apps/plateflow-api/src/infrastructure/http/app.ts`.
- `react` / `react-dom` `^19.0.1` — UI. Entry: `apps/plateflow-app/src/main.tsx`.
- `vite` `^6.2.3` — SPA build (`apps/plateflow-app/vite.config.ts` `outDir: dist`). Root `package.json` `build` copies `apps/plateflow-app/dist/*` to repo `dist/`.
- `qrcode` `^1.5.4` — QR generation on server (`publicRedirectRoutes.ts`) and client (`apps/plateflow-app/src/services/imageComposerService.ts`).
- `jszip` `^3.10.2` — batch plate ZIP export in `apps/plateflow-app/src/services/imageComposerService.ts`.
- `lucide-react` `^0.546.0` — icon set (`apps/plateflow-app/src/components/`).
- `motion` `^12.23.24` — animation library (app package). Use this, not a new animation framework.
- `@plateflow/types` `workspace:*` — shared domain types (`packages/types/src/index.ts`). Import types from here in API and app.
- `@plateflow/database` `workspace:*` — DB client + schema. API-only.

**Infrastructure:**

- `@supabase/supabase-js` `^2.116.0` — declared in root `package.json` only. **Do not import it.** Persistence goes through `pg` + Drizzle to Supabase Postgres (`packages/database/src/client.ts` rewrites `db.<ref>.supabase.co` to `aws-0-sa-east-1.pooler.supabase.com:6543`).
- `@google/genai` `^2.4.0` — declared in root `package.json` and allowed in `pnpm-workspace.yaml`. **No source import.** `metadata.json` flags `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` but there is no Gemini client in `apps/` or `packages/`.
- `express` `^4.21.2` + `@types/express` — declared in root `package.json`. **No `express` import.** The Vercel adapter in `apps/plateflow-api/src/server.ts` uses generic `req`/`res` and Fastify `app.inject()`.
- `@plateflow/tsconfig` — shared TS base at `packages/tsconfig/base.json` (`NodeNext` modules). App/API tsconfigs currently use `bundler` resolution instead of extending this package.

## Configuration

**Environment:**

- Load via `dotenv` from repo root `.env` when not on Vercel (`packages/database/src/client.ts` lines 8–11; `import 'dotenv/config'` in `server.ts` and `apps/plateflow-api/src/server.ts`).
- `.env.example` file present — committed env template (`.gitignore` ignores `.env*` and un-ignores `!.env.example`). Never read or quote `.env` / `.env.*` values.
- Turbo `globalEnv` in `turbo.json`: `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`, `PORT`, `NODE_ENV`.
- Code-consumed vars:
  - `DATABASE_URL` — Postgres connection (`packages/database/src/client.ts`, seed gate in `apps/plateflow-api/src/infrastructure/http/app.ts`). Fallback local URL is `postgresql://postgres:postgres@localhost:5432/postgres`.
  - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — single-admin login (`apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts`).
  - `PORT` — listen port, default `3005` (`server.ts`, `apps/plateflow-api/src/server.ts`).
  - `NODE_ENV` — Vite vs static HTML in `server.ts`; Fastify logger off when `test` (`app.ts`).
  - `VERCEL` — skip `listen()` and skip dotenv (`server.ts`, `apps/plateflow-api/src/server.ts`, `packages/database/src/client.ts`).
  - `DISABLE_HMR` — Vite HMR toggle (`apps/plateflow-app/vite.config.ts`).
- `JWT_SECRET` is listed in `turbo.json` only. Auth tokens are `mock_token_admin_<timestamp>` in `AuthController.ts` — do not assume JWT until implemented.

**Build:**

- Root `tsconfig.json` — `ES2022`, `moduleResolution: bundler`, `jsx: react-jsx`, `noEmit`, path alias `@/*` → `./*`.
- App `apps/plateflow-app/tsconfig.json` — same target; alias `@/*` → `./src/*`.
- API `apps/plateflow-api/tsconfig.json` — `strict: true`, `bundler` resolution.
- Shared `packages/tsconfig/base.json` — `NodeNext` + `strict`.
- `turbo.json` — pipeline + env passthrough.
- `vercel.json` — `outputDirectory: dist`; rewrites `/api/*` and `/r/*` to `/api/index?__route=...`; SPA fallback to `/index.html`.
- `pnpm-workspace.yaml` — workspace packages.
- `metadata.json` — product description + Gemini capability flag (AI Studio metadata, not runtime).
- Vite: `apps/plateflow-app/vite.config.ts` — React + Tailwind plugins, port `5173`.
- Drizzle Kit: `packages/database/drizzle.config.ts` — schema `./src/schema/index.ts`, dialect `postgresql`, output `./drizzle`.
- PWA manifest: `apps/plateflow-app/public/manifest.json`.

## Platform Requirements

**Development:**

- Node 22 + pnpm 11.9.0.
- PostgreSQL reachable via `DATABASE_URL` (local Postgres **or** Supabase). Without it, Fastify still boots; `/api/health` returns `503` if `SELECT 1` fails (`apps/plateflow-api/src/infrastructure/http/app.ts`).
- Unified command: `pnpm dev` → `tsx server.ts` (Fastify on `PORT`/`3005`, Vite middleware for non-`/api` and non-`/r/` paths).
- Isolated app: `pnpm --filter @plateflow/app dev` (Vite `5173` — API calls to `/api/*` need the unified server or a proxy).
- Isolated API: `pnpm --filter @plateflow/api dev` (`tsx watch src/server.ts`).
- DB scripts from `packages/database/package.json`: `pnpm --filter @plateflow/database migrate` (`src/migrate.ts`), `db:push` (`drizzle-kit push`), `db:generate` (`drizzle-kit generate`).
- No Docker / Compose detected. No ESLint / Prettier / Biome config.

**Production:**

- Primary target: Vercel. `vercel.json` + serverless entry `api/index.ts` imports `apps/plateflow-api/dist/server.js` default handler. Handler uses Fastify `inject()` (`apps/plateflow-api/src/server.ts`).
- Alternate: `NODE_ENV=production tsx server.ts` serves `dist/index.html` for non-API routes (`server.ts`). Build: `turbo run build` then copy `apps/plateflow-app/dist/*` → `dist/`.
- Listen host is `0.0.0.0` (`server.ts`). SSL for remote Postgres is `{ rejectUnauthorized: false }` unless the URL is localhost (`packages/database/src/client.ts`).
- Pool: `max: 10`, idle/connect timeouts 10s (`packages/database/src/client.ts`). Size serverless concurrency against this cap.

---

*Stack analysis: 2026-09-20*
