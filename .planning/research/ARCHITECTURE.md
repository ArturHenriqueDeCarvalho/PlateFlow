# Architecture Research

**Domain:** Internal print-shop QR/NFC plate ops (brownfield identity, ownership, campaigns)
**Researched:** 2026-09-21
**Confidence:** HIGH for integration with the existing Fastify Clean Architecture (first-party mapped codebase). MEDIUM for `@fastify/jwt` plugin API (official README + npm 10.2.2, Fastify 5 support from v9). Context7 MCP/CLI was unavailable; JWT/Drizzle API details were fetched from official docs.

## Standard Architecture

Keep the live stack. Do not add a second auth provider, a mediator bus, Postgres RLS, or a client router as a prerequisite. Identity is a new vertical that **plugs into** Route → Controller → UseCase → Drizzle Repository.

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PWA (`apps/plateflow-app`)  — still no router                          │
│  LoginScreen → App shell (role tabs) → StorageService Bearer fetches    │
│  Admin: users, lots, templates, all QRs/campaigns                       │
│  User:  own QRs, NFC, campaigns, readings, PNG/SVG                      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │  /api/*  Authorization: Bearer <JWT>
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  HTTP adapter (`infrastructure/http`)                                   │
│  @fastify/jwt  →  requireAuth / requireAdmin  →  controllers            │
│  Public: GET /r/:slug and resolve  (NO jwtVerify)                       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │  Actor { id, email, role } as execute() arg
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Application core (`core/`)                                             │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Auth UC  │ │ Users UC │ │ Ownership │ │ Campaign │ │ Privacy UC   │ │
│  │ login/me │ │ CRUD     │ │ assign    │ │ group QRs│ │ export/delete│ │
│  └──────────┘ └──────────┘ └───────────┘ └──────────┘ └──────────────┘ │
│  Existing plate/redirect/template/analytics use cases gain Actor        │
│  ResolveRedirectUseCase stays actor-free                                │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │  repository ports (I*)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Persistence (`@plateflow/database` + Drizzle*Repository)               │
│  users · campaigns · plates.owner_id · redirects.owner_id/campaign_id   │
│  analytics (IP stored, stripped on list DTO)                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `@fastify/jwt` | Sign/verify HMAC JWT; populate `request.user` after `jwtVerify()` | Register in `app.ts` with `JWT_SECRET`; Fastify 5 needs plugin >= v9 (current npm 10.2.2) |
| `requireAuth` | Coarse gate: valid token → `request.actor`; 401 otherwise | Replace prefix check in `authMiddleware.ts`; attach as `preHandler` on **all** inventory routes including GET |
| `requireAdmin` | Coarse gate: `actor.role === 'admin'`; 403 otherwise | Same file; user CRUD, templates writes, batch create, assignment |
| `AuthController` | Map HTTP login/me to use cases; no password compare in the controller | Thin; today it embeds env-admin logic — move that to `LoginUseCase` |
| `ITokenIssuer` | Sign claims `{ sub, email, role }` | Infrastructure adapter around `app.jwt.sign`; core never imports Fastify |
| `IPasswordHasher` | Hash/verify credentials | `node:crypto` scrypt (no native addon; Vercel `api/index.ts` is serverless) |
| `IUserRepository` | Persist internal users | New `DrizzleUserRepository` |
| `ICampaignRepository` | Persist campaign rows | New `DrizzleCampaignRepository` |
| Scoped list/update use cases | Authorization + owner filter | `execute(actor, …)`; admin → `findAll`, user → `findByOwnerId` |
| `ResolveRedirectUseCase` | Public scan + fire-and-forget analytics | Unchanged contract; no Actor; optional campaign title for HTML only |
| `AssignOwnerUseCase` | Admin sets owner on plate **and** matching redirect | Single transaction-ish use case; keep both `owner_id` columns in sync |
| Privacy use cases | LGPD export/delete of readings and accounts | Strip IP from UI lists; export/delete as explicit operations |
| `StorageService` | SPA HTTP + token storage | Send Bearer on **GET** lists (today templates/plates/redirects/analytics GETs omit the header) |
| Public HTML | Scan landing | `publicRedirectRoutes.ts` only; delete SPA `/r/:slug` branch in `App.tsx` |

## Recommended Project Structure

```
packages/types/src/index.ts          # AuthUser, Actor, Campaign, ownerId/campaignId on entities
packages/database/src/schema/index.ts
  users, campaigns                   # new tables + FKs + indexes
  plates.owner_id, plates.slug unique
  redirects.owner_id, redirects.campaign_id
apps/plateflow-api/src/core/
  actor.ts                           # Actor type + isAdmin/assertOwner helpers
  repositories/
    IUserRepository.ts
    ICampaignRepository.ts
    IPlateRepository.ts              # + findByOwnerId
    IRedirectRepository.ts           # + findByOwnerId, findByCampaignId
    IAnalyticsRepository.ts          # + findBySlugs / findByOwner
  use-cases/
    auth/                            # LoginUseCase, GetMeUseCase
    users/                           # Create, List, Deactivate
    ownership/                       # AssignOwnerUseCase
    campaigns/                       # Create, List, Update, Add/Remove QR
    privacy/                         # ExportUserData, DeleteReadings, DeleteAccount
    plates|redirects|templates|analytics/  # existing; add Actor to execute()
apps/plateflow-api/src/infrastructure/
  auth/                              # ScryptPasswordHasher, FastifyJwtTokenIssuer
  database/DrizzleUserRepository.ts
  database/DrizzleCampaignRepository.ts
  http/middleware/authMiddleware.ts  # requireAuth + requireAdmin
  http/routes/userRoutes.ts
  http/routes/campaignRoutes.ts
  http/routes/privacyRoutes.ts
apps/plateflow-app/src/
  App.tsx                            # auth gate + role tabs; no public /r fallback
  services/storageService.ts         # Bearer on every /api call except login
```

### Structure Rationale

- **`core/actor.ts`:** Ownership rules are business logic. Keep them next to use cases, not inside Fastify hooks and not inside Drizzle SQL only.
- **New use-case folders per resource:** Matches `core/use-cases/plates/` etc. Do not dump login into `AuthController`.
- **`ITokenIssuer` / `IPasswordHasher` ports:** Login stays testable without Fastify. Controllers stay HTTP mappers.
- **Schema in `@plateflow/database`:** Same place as `templates`/`redirects`/`plates`/`analytics`. Do not create a second schema package.
- **No `ICurrentUserService` hidden context:** Existing use cases take explicit `execute(...)` arguments. Pass `Actor` as the first argument. Hidden HTTP-context user breaks the public resolve path and any future jobs.

## Architectural Patterns

### Pattern 1: Authenticate at the edge, authorize in the use case

**What:** `requireAuth` only proves the JWT and builds `Actor`. Every mutating or listing use case receives that actor and enforces admin vs owner. Repositories never read `Authorization` headers.
**When to use:** All `/api/plates`, `/api/redirects`, `/api/templates`, `/api/analytics`, `/api/users`, `/api/campaigns`, `/api/privacy`. Not `GET /r/:slug`, not `GET /api/health`, not `POST /api/auth/login`.
**Trade-offs:** Slightly more `execute(actor, …)` signatures; authorization cannot be bypassed by adding a new controller later. Avoids the current bug where GETs are public and writes only check `mock_token_admin_`.

**Example:**
```typescript
// core/use-cases/redirects/UpdateRedirectUseCase.ts
export class UpdateRedirectUseCase {
  constructor(private redirectRepo: IRedirectRepository) {}

  async execute(actor: Actor, slug: string, updates: Partial<DynamicRedirect>): Promise<DynamicRedirect> {
    const existing = await this.redirectRepo.findBySlug(slug);
    if (!existing) {
      throw new Error(`Redirecionamento com slug "${slug}" não encontrado.`);
    }
    if (!isAdmin(actor) && existing.ownerId !== actor.id) {
      throw new ForbiddenError('Você não pode editar este QR.');
    }
    const { ownerId: _ignored, campaignId, ...safe } = updates as DynamicRedirect & { ownerId?: string };
    return this.redirectRepo.update(slug, { ...safe, updatedAt: new Date().toISOString() });
  }
}
```

Controllers map `ForbiddenError` → 403, missing → 400/404. Do not let clients set `ownerId` on ordinary updates; that is `AssignOwnerUseCase` only.

### Pattern 2: Query-level scope for lists (push the filter to SQL)

**What:** `GetPlatesUseCase` / `GetRedirectsUseCase` / `GetAnalyticsUseCase` / `ListCampaignsUseCase` choose `findAll()` vs `findByOwnerId(actor.id)` from the actor. The repository applies `WHERE owner_id = $userId` (analytics: join `redirects` on slug then filter owner). Never `findAll()` then `.filter()` in JS.
**When to use:** Every collection GET. NFC listing must use the same plate scope so a user cannot write someone else's tag.
**Trade-offs:** Two repository methods instead of one; admin and user share the use case. Prevents leaking other operators' inventory if a controller forgets to filter.

**Example:**
```typescript
export class GetRedirectsUseCase {
  constructor(private redirectRepo: IRedirectRepository) {}

  async execute(actor: Actor): Promise<DynamicRedirect[]> {
    if (isAdmin(actor)) return this.redirectRepo.findAll();
    return this.redirectRepo.findByOwnerId(actor.id);
  }
}
```

### Pattern 3: Dual `owner_id` kept in sync (plate + redirect)

**What:** Canonical operator identity lives on **both** `plates.owner_id` and `redirects.owner_id`, same user id. Print-shop NFC updates plates by id; destination edits hit redirects by slug; analytics join redirects. Assignment is one use case that writes both.
**When to use:** Admin attribution, user-created QRs (set both when a plate exists), batch create (default owner = acting admin, optional `assignToUserId`).
**Trade-offs:** Denormalized; `AssignOwnerUseCase` must update both or the NFC list and destination list diverge. Alternative (owner only on redirects + join for plates) saves a column but every NFC/inventory query joins — worse than one assignment write.

Do **not** introduce a `plate_assignments` history table in v1.

### Pattern 4: Campaign as grouping row, not a new auth system

**What:** `campaigns` table (`id`, `name`, `owner_id` → `users.id`). `redirects.campaign_id` nullable FK. One QR in at most one campaign. List: admin all; user rows where `campaigns.owner_id = actor.id`. Adding a QR to a campaign requires the actor to own that QR (or be admin). If admin reassigns a QR to another user, null `campaign_id` when the new owner is not the campaign owner.
**When to use:** After ownership exists. `batchIdentifier` stays a print-lot field on plates — it is **not** a campaign.
**Trade-offs:** No many-to-many in v1. A QR cannot sit in two campaigns; that is correct for this shop tool.

### Pattern 5: JWT plugin as `requireAuth`, never a global `onRequest`

**What:** Register `@fastify/jwt` with `secret: process.env.JWT_SECRET`. `requireAuth` calls `request.jwtVerify()`, then maps `request.user` (`sub`, `email`, `role`) to `Actor`. Attach via existing `{ preHandler: [requireAuth] }` (and `requireAdmin` where needed).
**When to use:** Replace `token.startsWith('mock_token_admin_')` in `authMiddleware.ts`. Sign in `LoginUseCase` via `ITokenIssuer`.
**Trade-offs:** Plugin couples Fastify to token crypto (acceptable: already `@fastify/cors` + `@fastify/formbody`). A **global** `onRequest` jwtVerify would 401 public scans — do not do that.

Boot: fail if `JWT_SECRET` is missing when `NODE_ENV === 'production'`. Seed the first admin **into `users`** from `ADMIN_EMAIL` / `ADMIN_PASSWORD` once; then login is only `users` + scrypt. Delete compiled fallbacks `admin@plateflow.com` / `plateflow2026`.

## Data Flow

### Request Flow

```
Browser (PWA)
    ↓  POST /api/auth/login { email, password }
AuthController → LoginUseCase → IUserRepository.findByEmail
                               → IPasswordHasher.verify
                               → ITokenIssuer.sign({ sub, email, role })
    ↓  { token, user }
localStorage nfc_qr_auth_token_v2 / nfc_qr_auth_user_v2

Browser
    ↓  GET /api/redirects   Authorization: Bearer <jwt>
requireAuth (jwtVerify) → request.actor
RedirectController.getAll → GetRedirectsUseCase.execute(actor)
    ↓  IRedirectRepository.findAll | findByOwnerId
PostgreSQL
    ↓  JSON without other operators' rows
StorageService → App state
```

Public scan (unchanged direction, still unauthenticated):

```
Phone QR/NFC
    ↓  GET /r/:slug   (no Authorization)
publicRedirectRoutes → ResolveRedirectUseCase.execute(slug, logMeta)
    ↓  findBySlug  +  fire-and-forget incrementClicks + analytics insert
307 / Pix HTML / vCard   (optional campaign title in HTML; no owner email; no IP)
```

### State Management

```
JWT (server is source of truth for identity)
    ↓
StorageService token keys (existing)
    ↓
App.tsx user + role  →  which tabs render
Server-scoped collections  →  plates / redirects / campaigns / analytics in React state
localStorage collection caches  →  optional; never write-ahead on failed HTTP
```

Do not filter other users' rows only in `PlatesInventory.tsx`. If the API returns them, the product has already failed.

### Key Data Flows

1. **Login:** Env-admin comparison in `AuthController` goes away. `LoginUseCase` loads `users` by email (unique), verifies scrypt hash, signs JWT. `GET /api/auth/me` uses `requireAuth` + `GetMeUseCase` (optional extra `users` lookup for `active === false` → 401).
2. **Inventory list:** GET plates/redirects/templates/analytics all sit behind `requireAuth`. Templates remain admin-only (`requireAdmin` on the plugin). Users never receive the full plate lot table.
3. **User-created QR:** New `CreateRedirectUseCase(actor, input)` sets `ownerId: actor.id` (admin may pass `ownerId` only through assignment). If the shop still prints first, admin assigns a virgin plate instead.
4. **Assignment:** `POST /api/plates/:id/assign` (`requireAdmin`) → `AssignOwnerUseCase` updates `plates.owner_id` and `redirects.owner_id` for that slug; clears `campaign_id` if the new owner does not own the campaign.
5. **NFC:** `UpdatePlateUseCase(actor, id, { nfcWritten })` loads plate, `assertOwner`, then update. Same actor rule as destination edit.
6. **Campaign grouping:** Create campaign with `owner_id = actor.id`. Attach via `redirects.campaign_id`. User list = own campaigns only.
7. **Analytics panel:** `GetAnalyticsUseCase(actor)` joins allowed slugs, **omits `ip`** from the DTO. IP remains in the table for admin/LGPD export only.
8. **LGPD export/delete:** `ExportUserDataUseCase(actor | admin+targetUserId)` returns JSON of profile + owned redirects/plates + readings (policy decides whether IP is in the file). `DeleteReadingsUseCase` deletes `analytics` for those slugs. `DeactivateUserUseCase` sets `active=false` (table stakes). Hard-delete account is admin-only: reassign or null-and-block QRs, then delete user row — do not cascade-delete physical plate inventory by default.
9. **Public HTML vs SPA:** Production scans never enter `App.tsx`. Remove the `pathname.match(/^\/r\//)` branch so campaign/owner copy cannot be a stale `localStorage` fallback.

## Suggested Build Order

Dependencies are strict. Do not start campaigns or LGPD before Actor exists on list/update use cases.

| Step | Deliverable | Unlocks | Avoids |
|------|-------------|---------|--------|
| **1. Schema** | `users` (id, email unique, name, role, password_hash, active, timestamps). Nullable `plates.owner_id` / `redirects.owner_id` FKs + indexes. Unique `plates.slug` (batch upsert already targets it). Committed drizzle-kit migration, not only `push`. | Everything else | Assigning owners into a table that does not exist; upsert failures on slug |
| **2. Seed admin user** | One `users` row from `ADMIN_EMAIL`/`ADMIN_PASSWORD`; backfill existing plates/redirects `owner_id` to that id | Login against DB | Split-brain env-admin vs table-admin |
| **3. Signed auth** | `@fastify/jwt`, `LoginUseCase`, `IPasswordHasher`, replace mock token; `requireAuth` on **GET and writes**; `StorageService` sends Bearer on GETs | Safe exposure of the API | Forged `mock_token_admin_*`; unauthenticated inventory dump |
| **4. Actor on existing use cases** | `execute(actor, …)` on get/update/delete plate & redirect & analytics; `requireAdmin` on templates + batch | Isolation | Client-side-only hiding of tabs |
| **5. User CRUD + assignment** | `userRoutes` admin-only; `AssignOwnerUseCase` | Non-admin operators | Users with no rows they can see |
| **6. User-created QR + NFC scope** | Create/edit destination in the owner's slice; NFC only on owned plates | Core value for operators | Operators stuck with admin-only batch |
| **7. Campaigns** | Table + routes + `campaign_id` on redirects | Grouping | Campaigns as a second `batchIdentifier` |
| **8. LGPD + public page** | Export/delete readings (and admin account delete); strip IP from list DTO; server-only `/r/:slug` copy using campaign title | Privacy + scan UX | IP in the dashboard; SPA fallback |

**Phase-shaped grouping for the roadmap:** 1–4 = “Identity & isolation spine”. 5–6 = “Operator slice”. 7 = “Campaigns”. 8 = “Privacy & public landing”. Templates, lots, and Pix/vCard renderers stay as they are; only their HTTP gates and owner fields change.

## Scaling Considerations

This is an internal gráfica tool. Optimize for correctness of isolation, not million-user fan-out.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k operators / tens of k QRs | Current monolith + Postgres. Indexed `owner_id`, `campaign_id`, unique slugs. Fire-and-forget analytics inserts stay. |
| Print-shop growth (more lots, same staff) | Keep one Fastify app. Add `findByOwnerId` indexes; paginate analytics (`limit` already exists). |
| Hypothetical public SaaS | Out of scope. Would need tenants, RLS, billing — do not design v1 as multi-tenant. |

### Scaling Priorities

1. **First bottleneck:** Unscoped `findAll()` on plates/redirects/analytics once multiple operators exist — fix with query-level owner filters (step 4), not a cache.
2. **Second bottleneck:** Analytics table growth from public scans — keep fire-and-forget writes; list by owned slugs + limit; later partition by time if needed (not v1).

## Anti-Patterns

### Anti-Pattern 1: Authorize only in `preHandler` or only in the React tab list

**What people do:** `requireAdmin` on some routes; hide the Users tab in `Header.tsx`; leave `GetPlatesUseCase.execute()` as `findAll()`.
**Why it's wrong:** GETs are currently public. Any caller with a stolen/forged token, or a user hitting `/api/plates`, still receives the shop's full inventory. UI hiding is not isolation.
**Do this instead:** `requireAuth` on inventory HTTP **and** `execute(actor)` with SQL `owner_id` filters.

### Anti-Pattern 2: Global Fastify `onRequest` jwtVerify

**What people do:** Copy the `@fastify/jwt` README global hook.
**Why it's wrong:** `GET /r/:slug` and health checks would 401. Physical plates stop resolving.
**Do this instead:** Per-route `preHandler: [requireAuth]` exactly as mutations already do; never register jwtVerify on `publicRedirectRoutes`.

### Anti-Pattern 3: Owner only on campaigns, or campaign = `batchIdentifier`

**What people do:** Skip `owner_id` on plates/redirects and treat lot codes or campaign membership as ACL.
**Why it's wrong:** Lots are print artifacts (admin). A user can own QRs in no campaign. NFC and destination edits would have no stable principal.
**Do this instead:** `owner_id` on plate + redirect; campaign is an optional group of already-owned QRs.

### Anti-Pattern 4: Filter in the repository using a client-supplied `userId` query param

**What people do:** `GET /api/redirects?ownerId=…` and trust the query string.
**Why it's wrong:** A user passes another id and reads their inventory (IDOR).
**Do this instead:** Scope from `actor.id` inside the use case. Admin lists everyone with no query param, or an admin-only `userId` filter that still checks `isAdmin(actor)`.

### Anti-Pattern 5: `ICurrentUserService` reading Fastify request from core

**What people do:** Hidden current-user singleton so `execute()` stays parameterless.
**Why it's wrong:** Use cases gain an implicit HTTP dependency; `ResolveRedirectUseCase` must not see a user; tests need a fake CLS/request.
**Do this instead:** Explicit `Actor` argument (this codebase already uses explicit `execute` params).

### Anti-Pattern 6: Returning IP on `GET /api/analytics` and logging it in the PWA

**What people do:** Keep `DrizzleAnalyticsRepository.mapRow` including `ip` now that lists are authenticated.
**Why it's wrong:** v1 LGPD rule is IP in the database, not in the UI. Auth on GET is necessary but not sufficient.
**Do this instead:** Strip `ip` in `GetAnalyticsUseCase` (or a dedicated DTO mapper). Include IP only in admin export if product policy says so.

### Anti-Pattern 7: SPA `/r/:slug` as a second resolver

**What people do:** Leave `App.tsx` matching `/r/` and reading `localStorage`.
**Why it's wrong:** Public visitors have empty cache; campaign/owner copy cannot appear; Pix/vCard HTML already lives on the server.
**Do this instead:** Fastify `publicRedirectRoutes` is the only production resolver. Simulator stays a modal.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PostgreSQL (Supabase as host SQL) | Existing `pg` pool + Drizzle | No `@supabase/supabase-js` Auth. New tables go in the same schema file. |
| Vercel `api/index.ts` | Same Fastify `inject` handler | `@fastify/jwt` is already an `@fastify/*` esbuild external. Password hashing must stay pure JS (`node:crypto`). |
| Chrome Web NFC | Existing `NfcAssistantModal` | Gate slugs through scoped plate GET/update; do not change the NFC stack. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| PWA ↔ API | REST + Bearer JWT | Same `/api/*` prefixes. Add `/api/users`, `/api/campaigns`, `/api/privacy/*`. |
| HTTP ↔ core | Controller passes `req.actor` into `execute` | Controllers do not call repositories. |
| Core ↔ persistence | `I*` ports | `findByOwnerId` lives on the port; Drizzle implements `eq(owner_id, id)`. |
| Public resolve ↔ identity | None | `ResolveRedirectUseCase` must not import user/campaign auth helpers. Optional `campaignId` on the redirect row is data, not a permission check. |
| Plate ↔ redirect ownership | `AssignOwnerUseCase` + create paths | Always write both `owner_id` columns. |
| Campaign ↔ redirect | `redirects.campaign_id` FK | No join table in v1. |
| Analytics ↔ owner | Join `analytics.redirect_slug` → `redirects.slug` → `owner_id` | Still no FK today; add slug FK or accept join-without-FK in v1, but **do** index `redirect_slug`. |
| Templates ↔ users | Admin only | Operators do not need templates to change destination or download a QR asset. |

## Sources

- First-party mapped architecture (2026-09-20): `.planning/codebase/ARCHITECTURE.md`, `CONCERNS.md`, live `apps/plateflow-api` routes/use cases/repos, `packages/database/src/schema/index.ts`, `packages/types/src/index.ts` — **HIGH** (codebase).
- `@fastify/jwt` README (Fastify 5 = plugin >= v9; `jwtVerify` → `request.user`; per-route authenticate decorator): https://github.com/fastify/fastify-jwt — **MEDIUM** (official docs + npm 10.2.2, legitimacy OK).
- npm `@fastify/jwt` 10.2.2 — **MEDIUM**.
- Authentication vs authorization layering: Milan Jovanović, 2026-08-11, https://milanjovanovic.tech/blog/authentication-authorization-clean-architecture — **MEDIUM** (websearch, cross-checked).
- Query-level list authorization: Oso Authorization Academy, https://www.osohq.com/academy/authorization-enforcement — **MEDIUM** (websearch, cross-checked).
- Application-layer tenancy vs repository-as-dumb-store: https://softwareengineering.stackexchange.com/questions/445720/clean-architecture-and-access-control — **MEDIUM**.
- Drizzle FKs vs `relations()`, indexes: https://orm.drizzle.team/docs/indexes-constraints , https://orm.drizzle.team/docs/relations — used as API reference for the same ORM already in-repo (`drizzle-orm` 0.45.2). Seam flagged a generic webfetch of the package name as LOW/SUS; claims are limited to patterns already consistent with this codebase’s schema file.

### Gaps

- Exact JWT TTL / refresh: not specified by product; recommend short-lived access token (e.g. 8–12h shop shift) with re-login, no refresh-token store in v1 — confirm in phase research.
- Hard-delete vs deactivate when an operator leaves: product says both “desativar” and admin delete; default deactivate, hard-delete as privacy path.
- Whether user export includes IP: UI must not; file export is a policy call.

---
*Architecture research for: PlateFlow identity, ownership, campaigns, and signed auth on the existing use-case + repository stack*
*Researched: 2026-09-21*
