# Walking Skeleton — PlateFlow

**Phase:** 1
**Generated:** 2026-09-21

## Capability Proven End-to-End

A seeded gráfica admin signs in from the existing `LoginScreen`, receives HttpOnly session cookies, `GET /api/auth/me` returns `{ user }`, and `GET /api/plates` succeeds only with that cookie — while `GET /r/:slug` stays anonymous.

This is a **brownfield** walking skeleton: do not scaffold a new repo, framework, or print console. Prove identity on the live Fastify 5 + React 19 PWA + Drizzle/Postgres stack.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Existing Fastify 5 API (`createFastifyApp`) + React 19 Vite PWA (`apps/plateflow-app`); unified `pnpm dev` / `server.ts` | CONTEXT D-02 same-origin; do not introduce a client router or a second host |
| Data layer | Postgres via `drizzle-orm` `^0.45.2` + `drizzle-kit` `^0.31.10`; new `users` and `refresh_sessions` only | Existing `templates`/`plates`/`redirects`/`analytics` already live via `db:push`; RESEARCH Pitfall 5 forbids regenerating them |
| Auth | `@fastify/jwt` `^10.2.2` + `@fastify/cookie` `^11.1.2`; access JWT cookie `plateflow_access` + opaque refresh cookie `plateflow_refresh`; Node `crypto.scrypt`; `onlyCookie: true` | CONTEXT D-01–D-04; delete forgeable prefix in the same change; no Better Auth / Supabase Auth / Argon2 |
| Deployment target | Existing unified process (`tsx server.ts`) and Vercel `api/index.ts` inject adapter | Brownfield host; fail-closed in production/`VERCEL` without `JWT_SECRET` and admin seed env |
| Directory layout | Clean Architecture already in `apps/plateflow-api/src/{core,infrastructure}`; SPA orchestrator `App.tsx` + `StorageService` | New auth ports/use cases live in `core/`; JWT/scrypt stay in `infrastructure/`; UI stays zinc/Tailwind `components/ui` |

## Stack Touched in Phase 1

- [x] Project scaffold (framework, build, lint, test runner) — existing monorepo; Wave 0 adds `node:test` + Fastify `inject` only
- [x] Routing — existing `/api/auth/login`, `/api/auth/me`, `/api/plates`, `/r/:slug` (no new SPA router)
- [ ] Database — real write: idempotent admin seed into `users`; real read: `GET /api/plates` after cookie login
- [ ] UI — existing `LoginScreen` Entrar wired to cookie `credentials: 'include'`
- [ ] Deployment — documented local full-stack run: `pnpm dev` (same origin); do not add Vite `:5173` as a cookie target (D-02)

## Out of Scope (Deferred to Later Slices)

- Admin provisioning of other users, deactivate, public signup (AUTH-02 / Phase 3)
- `owner_id` / `assigned_user_id` SQL slice (OWN-* / Phase 3)
- Public HTML hardening, SPA `/r/:slug` localStorage fallback removal (SCAN-* / Phase 2)
- Header password menu is Phase 1 expansion (AUTH-03), not this skeleton path
- Print-lot ZIP D-07 pendingLogout is Phase 1 expansion (SHOP-01), not this skeleton path
- Login rate-limit / lockout (AUTH-04) and forgot-password (AUTH-05) — v2
- Helmet, Vitest, Zod, Better Auth, Argon2, Redis sessions

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 1 expansion: refresh + 8h ceiling, GET locks + IP omit, Header password change, cookie-backed print-lot persist (D-07)
- Phase 2: Public scan hardening — `/r/:slug` is the only resolver; safe HTML
- Phase 3: Users and ownership — admin-provisioned users; SQL slice on list/edit
- Phase 4: Operator slice — destinations, NFC, PNG/SVG, slice ZIP
- Phase 5: Campaigns and privacy — campaign grouping, scoped analytics, operational LGPD
