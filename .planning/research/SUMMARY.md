# Project Research Summary

**Project:** PlateFlow
**Domain:** Internal print-shop QR/NFC dynamic-plate ops (Brazil); brownfield multi-user identity on an existing Fastify 5 + React 19 PWA
**Researched:** 2026-09-21
**Confidence:** HIGH for stack-keep and architecture fit; MEDIUM for feature UX copy and LGPD/Pix legal mapping

## Executive Summary

PlateFlow is not a greenfield QR SaaS. It is an internal gráfica console that already prints lots, writes NFC, and resolves `/r/:slug` to URL / WhatsApp / Pix / vCard. Experts in this niche (NFC card ops such as NFCTagify/ixkio/ZAPPED, not Uniqode/Bitly marketing clouds) isolate **physical assets per operator**, keep a **stable public URL with a server-side destination**, and treat campaigns as grouping — never as print lots. v1 succeeds when an admin provisions users, each operator only manages created-or-assigned QRs, and a scan still hits the current destination without reprinting.

Keep Fastify 5, React 19, Vite 6, Drizzle/`pg`, and the Route → Controller → UseCase → Repository layout. Add `@fastify/jwt` 10.x + `@fastify/cookie` 11.x + helmet + rate-limit; hash passwords with Node 22 `crypto.scrypt` (not `argon2` on this Vercel/esbuild path); store identity in a Drizzle `users` table. Authorize in use cases with an explicit `Actor` and SQL `owner_id ∪ assigned_user_id` filters — never in React tabs. Two roles only (`admin` | `user`). Do not adopt Better Auth, Supabase Auth, Redis sessions, or a client router as prerequisites.

The blast radius is already in production: a guessable `mock_token_admin_*` prefix, unauthenticated inventory/analytics GETs (including IP), CORS `origin: true`, unescaped public HTML, and non-unique `plates.slug`. Kill the bypass, lock GETs, allowlist CORS, unique slugs, and HTML/scheme hardening **before** non-admin editors exist. Do not put a cookie banner on `/r/:slug`, do not add geo, billing, public signup, or iOS NFC in this milestone.

## Key Findings

### Recommended Stack

Details: [STACK.md](STACK.md)

This is an additive milestone on the live monorepo. New API deps go on `@plateflow/api` only. Schema work stays in `@plateflow/database` via committed `drizzle-kit` migrations (`db:generate` then `migrate` — never production `db:push` for uniqueness/FKs).

**Core technologies (keep):**
- Fastify `^5.2.1` (plugins target `^5.x`) — HTTP API + public `/r/:slug`; no Express revival
- React 19 + Vite 6 + Tailwind 4 — existing PWA; no Next.js rewrite, no required router
- Drizzle ORM `^0.45.2` + `pg` `^8.23.0` — users, custody, campaigns, analytics filters; Supabase is SQL host only
- Node 22 — `crypto.scrypt`, `randomUUID`, `timingSafeEqual`; no extra UUID package
- `qrcode` `^1.5.4` — PNG (`toDataURL` ~1024px) + SVG (`toString({ type: 'svg' })`) of `/r/{slug}` only
- pnpm 11 + Turbo — existing workspace

**Auth/hardening (add):**
- `@fastify/jwt` `^10.2.2` — HS256; claims `sub`, `role`, `email`; `expiresIn: '8h'`; fail boot if `JWT_SECRET` missing (no default)
- `@fastify/cookie` `^11.1.2` — register **before** JWT; cookie name `plateflow_token`, `httpOnly`, `secure` in prod, `sameSite: 'lax'`
- Bearer fallback stays — matches today’s `StorageService` `Authorization` header; v1 may still return `{ token, user }` for one release while `fetch` uses `credentials: 'include'`
- Node `crypto.scrypt` — `N=131072`, `r=8`, `p=1`, 32-byte key, 16-byte salt; store `scrypt$N$r$p$saltB64$keyB64`; **do not** add native `argon2` on Vercel/esbuild
- `@fastify/helmet` `^13.1.1` — disable CSP/helmet on Pix/vCard HTML that needs inline CSS
- `@fastify/rate-limit` `^11.2.0` — login throttle; persist lockout on `users.failed_login_count` / `locked_until` (in-memory store is not shared across Vercel isolates)
- Tighten existing `@fastify/cors` — pin `APP_ORIGIN`; `origin: true` + credentials is unsafe once sessions are real

**JWT revocation in v1:** `jwtVerify()` then Drizzle load of `users` by `sub`; reject if missing or `active=false`. No Redis, no denylist.

**Critical versions:** `@fastify/jwt` >=9 for Fastify 5; cookie >=10; helmet >=12. Seed first admin once from `ADMIN_EMAIL` / `ADMIN_PASSWORD` into `users`, then delete plaintext env compare and compiled `admin@plateflow.com` / `plateflow2026`.

### Expected Features

Details: [FEATURES.md](FEATURES.md)

v1 is an **ops console**, not Uniqode. Public SaaS table-stakes (billing, geo maps, self-serve signup, iOS NFC, scan-time consent) are anti-features here.

**Must have (table stakes):**
- Admin-only user create/deactivate — no public signup, no invite-then-create-account
- Signed JWT replacing `mock_token_admin_*` — login, logout, `/me`, password change; two roles
- Per-QR custody — `owner_id` (creator) + `assigned_user_id` (admin); user slice = created ∪ assigned; server enforces on **every** list/update/NFC/analytics route
- Isolated NFC write — only slugs in the caller’s slice; Chrome Android, HTTPS, user gesture
- NFC payload `/r/{slug}?src=nfc` — QR downloads stay `/r/{slug}` (no `src`, defaults to `qr`); current write path omits the query so taps log as QR
- User create/edit URL, WhatsApp (`wa.me` digits-only), Pix landing (EMV on page, not in printed QR), vCard HTML + `.vcf` in their slice
- Public `GET /r/:slug` as the only scan path — 307 URL/WhatsApp; HTML Pix/vCard; never SPA `localStorage`
- PNG + SVG QR download of the short URL — plate ZIP/art stays admin
- Campaigns as a first-class grouping — not `batchIdentifier`; delete campaign must **not** cascade-delete QRs
- Analytics: date range, device (iOS/Android/Desktop/Outro), source `qr`/`nfc`; slice-scoped; GETs authenticated
- IP stored if needed for abuse, **omitted from every JSON DTO and from the UI** (including admin)
- Privacy policy (public) + export/delete scan logs + admin account deactivate/delete — no consent wall on `/r/:slug`

**Should have (competitive — ship in v1, they *are* the product):**
- Per-asset custody instead of an org-wide library — core value; before prettier dashboards
- Hybrid plate (same slug, QR + NFC, comparable counts) — only if `?src=nfc` is actually written
- Brazil destinations as first-class types — already in code; keep parity under owner rules
- Print-lot console stays admin — users do not wander into templates/batch ZIP
- Operational LGPD (hide/strip IP, export/delete) without geo or cookie banners
- SVG QR beside existing plate art — print shop needs vectors; do not replace ZIP with QR-only SVG

**Defer (v1.x / v2+):**
- Admin assigns an entire print lot in one action; forced password reset; campaign comparison charts; analytics retention job; assignment audit trail
- Billing, public SaaS, geo, iOS Core NFC, scan consent/CMP, custom domains, GA4, SSO, `makeReadOnly()` chip lock, productized `social` type

### Architecture Approach

Details: [ARCHITECTURE.md](ARCHITECTURE.md)

Plug identity into the existing Clean Architecture. Do not add a mediator, Postgres RLS, Better Auth catch-all, or `ICurrentUserService` hidden HTTP context. `ResolveRedirectUseCase` stays actor-free.

**Major components:**
1. `@fastify/jwt` + `requireAuth` / `requireAdmin` — edge authentication only; per-route `preHandler`, **never** global `onRequest` jwtVerify
2. `Actor { id, email, role }` — first argument to `execute()` on every inventory/analytics/user/campaign/privacy use case
3. `ITokenIssuer` + `IPasswordHasher` ports — core never imports Fastify; scrypt + `app.jwt.sign` live in infrastructure
4. `IUserRepository` / `ICampaignRepository` + `findByOwnerId` (slice) on plates/redirects/analytics — query-level scope, never `findAll()` then `.filter()` in JS
5. `AssignOwnerUseCase` — writes **both** `plates.owner_id` and `redirects.owner_id` (and `assigned_user_id` when assigning without transferring creator); clients cannot set `ownerId` on ordinary updates
6. Public HTML only in `publicRedirectRoutes.ts` — delete the SPA `/r/:slug` branch in `App.tsx`
7. Privacy use cases — export/delete readings; strip `ip` in the list DTO mapper so it never reaches `@plateflow/types` consumed by the SPA

**Opinionated resolutions of research conflicts:**
- **Custody model:** follow FEATURES/PROJECT.md, not architecture’s “assignment overwrites owner.” Keep `owner_id` (creator) + `assigned_user_id` (nullable). Slice = owner **or** assignee. Admin UI shows “criado por / atribuído a.” Transfer of creator is a separate admin action if ever needed.
- **Token transport:** follow STACK’s cookie + Bearer fallback, but treat **Bearer as the v1 compatibility path** (existing `StorageService`). HttpOnly cookie is in-scope if it lands in the same auth PR; do not block ownership on a cookie/CSRF redesign. Collapse to **one** storage key; 401 must `logout()` and must not restore user from cache.
- **Campaigns:** `campaigns` table + `redirects.campaign_id` (one QR, one campaign, no join table). Not `batchIdentifier`. User list = campaigns they own **or** that contain a QR in their slice. Reassigning a QR off the campaign owner nulls `campaign_id`.
- **IP in export:** PITFALLS/PROJECT.md win — v1 export JSON/CSV has **no IP**, including admin. DB may retain `analytics.ip` for abuse; it is not a product field.

**Key patterns:** authenticate at the edge, authorize in the use case; push list filters to SQL; dual plate/redirect owner columns kept in sync; JWT plugin on selected routes only.

### Critical Pitfalls

Details: [PITFALLS.md](PITFALLS.md)

1. **Auth theater** — signed JWT beside `mock_token_admin_*`, compiled default password, dual localStorage keys, `/me` hydrating from prefix. **Avoid:** delete the prefix check in the same change as JWT; fail closed without `JWT_SECRET`; forged prefix must 401.
2. **Client-side “my QRs” while GETs dump the shop** — UI filter over unauthenticated `findAll` is BOLA (OWASP API1). **Avoid:** `requireAuth` on GET **and** `execute(actor)` with SQL slice; never accept `ownerId` from the client on create/update.
3. **LGPD theater** — hide IP column, still return `ip` on the wire (API3 + Lei 13.709 Art. 5). **Avoid:** DTO without `ip`; lock analytics GETs in the auth phase so the dump is not public while waiting for export/delete.
4. **Global `requireAuth` or SPA `/r/:slug` fallback** — printed plates 401 or visitors hit empty `localStorage`. **Avoid:** public surface is only `GET /r/:slug` (and resolve); contract-test Vercel `inject` **and** local `server.ts`; no tokens in NFC/QR payload.
5. **Non-unique `plates.slug` + prefix upsert** — second lot silently retargets metal already in the wild. **Avoid:** unique `plates.slug` + lowercase lookup in a committed migration **before** multi-user inserts; never rename a printed slug.
6. **Stored XSS + `javascript:` once users edit destinations** — public HTML interpolates title/Pix/vCard today. **Avoid:** HTML-entity encode every field; allowlist `http:`/`https:`; WhatsApp only via `https://wa.me/{digits}`; drop `cdn.tailwindcss.com`; harden **before** non-admin editors.
7. **CORS `origin: true` + real sessions** — token theft the day JWT ships. **Avoid:** allowlist `APP_ORIGIN` in the same PR as the token swap.

Do not invert order: bypass + CORS + lock GETs → unique slugs + public HTML contract → users + object ACL → NFC scope → campaigns → LGPD export/delete. XSS/scheme hardening belongs with public resolve, before user destination editors.

## Implications for Roadmap

Based on research, suggested phase structure (five phases). Do not start campaigns or user-created QRs before `Actor` exists on list/update use cases. Do not add operators on top of the mock token.

### Phase 1: Identity spine (schema, signed auth, lock the API)
**Rationale:** Every later feature enlarges blast radius while `mock_token_admin_*`, public GETs, and reflected CORS exist. Schema must exist before assignment. Unique `plates.slug` is blocking for any insert path.
**Delivers:** `users` table; nullable `plates.owner_id` / `redirects.owner_id` / `assigned_user_id` + indexes; unique `plates.slug`; committed migration; seed first admin from env into `users` and backfill existing rows to that id; `@fastify/jwt` + cookie plugin + helmet + login rate-limit; `LoginUseCase` / scrypt / `ITokenIssuer`; `requireAuth` on **all** inventory and analytics GETs; CORS allowlist; IP stripped from analytics DTO; StorageService sends Bearer (and credentials) on GETs; prefix check and compiled default password gone.
**Addresses:** Signed session/JWT; authenticated inventory GETs; hide IP on the wire (partial LGPD); admin seed.
**Avoids:** Pitfalls 1, 3 (public dump), 5 (slug unique), 7 (CORS). Persist login lockout on `users`, not memory-only.
**Uses:** `@fastify/jwt` 10.2.2, `@fastify/cookie` 11.1.2, `@fastify/helmet` 13.1.1, `@fastify/rate-limit` 11.2.0, `crypto.scrypt`, drizzle-kit migration.

### Phase 2: Harden public `/r/:slug`
**Rationale:** Physical plates must keep resolving without a session. Unescaped HTML is shop-wide XSS the moment assigned users edit Pix/vCard. SPA fallback is a second, wrong resolver. Do this before operator destination editors (Phase 4).
**Delivers:** HTML-entity encoding (or a real template) for every interpolated field; `http`/`https` allowlist at save and resolve; WhatsApp only `wa.me` digits; drop Tailwind Play CDN for inline CSS; delete `App.tsx` `/r/` localStorage branch; contract tests for virgin/active/paused/url/whatsapp/pix/vcard/404 through **both** Vercel `inject` and local listen; public privacy-policy link in the scan footer (page body can land in Phase 5).
**Addresses:** Public `/r/:slug` as source of truth; campaign/owner-aligned copy only if it does not leak other clients (title/campaign name only — never owner email).
**Avoids:** Pitfalls 4 and 6; global jwtVerify; tokens in NFC/QR payload.

### Phase 3: Users, ownership, assignment, SQL isolation
**Rationale:** Isolation is one authorization question reused by NFC, downloads, campaigns, and analytics. FEATURES: no user slice until admin-created accounts exist. Architecture: `execute(actor)` on get/update/delete plate, redirect, analytics; `requireAdmin` on templates, batch, user CRUD.
**Delivers:** Admin create/deactivate users (no `/register`); `requireAdmin` matrix (BFLA); `Actor` helpers `isAdmin` / `assertCanManage`; list queries `findAll` vs `findByOwnerOrAssigned`; `AssignOwnerUseCase` syncing plate + redirect; deactivated user rejected after `jwtVerify` via `active=false`; users cannot mass-assign `role`/`ownerId`/`nfcWritten`.
**Addresses:** Admin-only provisioning; per-QR ownership + assignment; isolated listing.
**Avoids:** Pitfall 2 (UI-only filter), pitfall 8 (users running the gráfica), cascade-delete of printed slugs on deactivate.
**Implements:** `core/actor.ts`, `IUserRepository`, `userRoutes`, ownership use cases.

### Phase 4: Operator slice (destinations, NFC, PNG/SVG)
**Rationale:** Core value for non-admin operators. Depends on object ACL (Phase 3) and a safe public renderer (Phase 2). NFC `?src=nfc` is what makes QR vs NFC analytics true; resolver already understands it.
**Delivers:** User create/edit URL, WhatsApp, Pix, vCard in slice (virgin → active; paused stops resolve); Pix key/phone/CRC validation and WhatsApp `55DDD…` at save; NFC assistant only for scoped slugs; write `https://{host}/r/{slug}?src=nfc`; confirm read-back before `nfcWritten`; desktop/iOS show copy-URL + “use Chrome on Android” (no fake Web NFC); PNG + SVG download of `/r/{slug}` for owned/assigned slugs; plate ZIP/templates remain admin.
**Addresses:** User destination edit; isolated NFC; PNG/SVG; hybrid-plate differentiator.
**Avoids:** Cross-user `nfcWritten`; encoding Pix EMV or vCard in the printed QR; `makeReadOnly()`; iOS NFC promise; `res.ok` ignored / localStorage write-ahead.
**Uses:** Existing `qrcode`, `NDEFReader`, `PixCodeService` (harden EMV `11` vs `12` and phone `+55` here).

### Phase 5: Campaigns, scoped analytics, operational LGPD
**Rationale:** Campaigns enhance analytics and conflict with lots — they need ownership first. Full export/delete requires scoped logs so a user export is not a shop dump. IP strip already started in Phase 1; this phase finishes Art. 9 / Art. 18 operational controls.
**Delivers:** `campaigns` + `redirects.campaign_id`; create/list/add/remove QR; no cascade-delete; admin sees all, user sees own/slice campaigns; analytics panel date + device + source with SQL aggregates (do not trust the 200-row cap); privacy policy page; `GET /api/privacy/export` (no IP); `DELETE` readings in scope; admin deactivate/delete account without unprinting metal unless paused.
**Addresses:** Campaign grouping; analytics by date/device/QR vs NFC; privacy policy; export/delete; admin account delete.
**Avoids:** Campaigns = `batchIdentifier`; Uniqode-style folder-delete that 404s plates; IP in UI/CSV; cookie banner on `/r/:slug`; geo; consent-on-scan; DSR SaaS.

### Phase Ordering Rationale

- Dependencies are strict: signed auth → provisioning → ownership → (NFC | user destinations | campaigns | scoped analytics/export).
- Architecture grouping 1–4 (schema, seed, JWT, Actor) maps to **Phase 1 + start of Phase 3**; public harden is pulled **ahead of operators** because XSS blast radius is the printed plate.
- Feature grouping: table-stakes identity and isolation before grouping and privacy pages; PNG/SVG and NFC hitch to the operator slice because they are the same `assertCanManage` check.
- Pitfall order forbids campaigns/NFC/LGPD-export on top of a bypass or public `findAll`.
- Templates, lots, Pix/vCard **renderers** stay; only HTTP gates, owner fields, encoding, and validation change.

### Research Flags

Phases likely needing `/gsd-plan-phase --research-phase` during planning:
- **Phase 2:** Pix BR Code (BCB phone `+55`, EMV point-of-initiation `11` vs current `12`, CRC tests) and a safe HTML templating approach for public landings — domain-specific, easy to get wrong.
- **Phase 4:** Web NFC write+verify UX and `?src=nfc` as best-effort analytics (spoofable; not ACL) — confirm payload and iOS copy-path copy.
- **Phase 5:** LGPD operational mapping (what the policy says vs what is stored; export shape; deactivate vs hard-delete; whether ANPD small-agent deadlines apply — they do **not** waive Art. 18). Campaign list semantics (owner vs membership) if requirements debate.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Fastify 5 JWT/cookie/helmet/rate-limit + Drizzle migration + scrypt are documented in STACK.md; follow the repo’s existing plugin registration.
- **Phase 3:** Explicit `Actor` + query-level owner filter is the architecture already used (`execute(...)` args); two-role ACL is not Cerbos/CASL territory.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Fastify plugin versions and JWT cookie/Bearer pattern from official READMEs + npm (legitimacy OK). MEDIUM only on hasher: OWASP prefers Argon2id; this deploy must use `crypto.scrypt`. Context7 unavailable; versions cross-checked with `npm view` the same day. |
| Features | MEDIUM | Competitor/NFC-ops analogs via websearch; no public teardown of “invite-only QR platform with zero product signup.” Custody model is consistent; exact UX copy is not. WhatsApp FAQ fetch returned 400; format from official snippet. ANPD has no QR-scan-specific guide. |
| Architecture | HIGH | First-party mapped codebase (2026-09-20) for boundaries and build order. MEDIUM for `@fastify/jwt` plugin API (official README). JWT TTL/refresh and hard-delete vs deactivate were product gaps — resolved here as 8h + re-login, default deactivate. |
| Pitfalls | HIGH | Codebase-confirmed debt (mock token, public GETs, XSS, slug, SPA `/r/`, CORS, IP). MEDIUM for OWASP/LGPD/ANPD/W3C/BCB framing (websearch `--verified`). |

**Overall confidence:** HIGH enough to roadmap and lock stack/architecture; MEDIUM on legal wording and Pix EMV details (flag Phase 2 and Phase 5 for planning research).

### Gaps to Address

- **Cookie vs Bearer as primary:** STACK wants HttpOnly cookie; architecture maps to existing localStorage Bearer; pitfalls say Bearer is the smaller CSRF surface. **Planning default:** JWT plugin with Bearer required in v1; cookie set in the same login response if inexpensive; single storage key; CORS allowlist either way.
- **Owner vs assignee columns vs “assignment overwrites owner”:** Architecture simplified to one `owner_id`. **Planning default:** both columns; slice = union. Confirm copy for unassign (creator keeps access).
- **JWT TTL / refresh:** not specified by product. **Planning default:** 8h, no refresh-token store; `active=false` checked every request.
- **IP at rest:** hide + no geo is decided; whether to hash/stop collecting is not. **Planning default:** keep column, never map to SPA types, omit from export; revisit hashing in a later security review.
- **ANPD small-agent status:** fact-specific; does not change engineering (still ship export/delete).
- **Node built-in Argon2:** re-check before ever adding the `argon2` package.
- **`@fastify/rate-limit` on Vercel isolates:** not load-tested; persist lockout on `users` regardless.
- **Analytics fire-and-forget vs delete race:** once export/delete is promised, await or queue inserts so delete is complete.
- **Repo has no test runner:** if tests are added, Vitest — not Jest. Auth/BOLA contract tests are the highest-value first suite.

## Sources

### Primary (HIGH confidence)
- Existing repo map (2026-09-20): `.planning/codebase/STACK.md`, `ARCHITECTURE.md`, `CONCERNS.md`; `AuthController.ts`, `authMiddleware.ts`, `publicRedirectRoutes.ts`, `packages/database/src/schema/index.ts`, `NfcAssistantModal.tsx`, `App.tsx`, `storageService.ts`
- `@fastify/jwt` README — Fastify 5 = v9+, cookie + Bearer fallback — https://github.com/fastify/fastify-jwt
- npm registry (2026-09-21): `@fastify/jwt@10.2.2`, `@fastify/cookie@11.1.2`, `@fastify/helmet@13.1.1`, `@fastify/rate-limit@11.2.0`, `qrcode@1.5.4` — legitimacy OK
- `qrcode` `toDataURL` / `toString({ type: 'svg' })` — https://www.npmjs.com/package/qrcode
- PROJECT.md (2026-09-21) — internal tool, two roles, no billing/geo/signup/iOS NFC/scan consent

### Secondary (MEDIUM confidence)
- OWASP Password Storage Cheat Sheet — Argon2id first, scrypt `N=2^17`, `r=8`, `p=1` — https://github.com/OWASP/CheatSheetSeries
- Node.js 22 `crypto.scrypt` (no `crypto.argon2`) — https://nodejs.org/docs/latest-v22.x/api/crypto.html
- OWASP API1/API3/API5 2023 (BOLA, excessive data, BFLA)
- Lei nº 13.709/2018 Arts. 5, 9, 18 — https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- ANPD titular rights / cookies guide / Res. CD/ANPD nº 2/2022 (small agents still owe Art. 18)
- Chrome Web NFC — https://developer.chrome.com/docs/capabilities/nfc
- BCB Pix initiation / BR Code manual
- Uniqode / QR TIGER / Bitly / NFCTagify / ixkio / ZAPPED help articles (custody vs folder SaaS)
- Authentication vs authorization layering (Clean Architecture) — Milan Jovanović; Oso Authorization Academy query-level lists
- Better Auth Fastify adapter — compatible on paper, **do not adopt** (catch-all, own schema, public-signup defaults, legitimacy SUS)

### Tertiary (LOW confidence)
- Context7 MCP/CLI unavailable; some docs via webfetch (treat as LOW unless legitimacy OK / first-party code)
- `argon2` missing native prebuilds on Vercel — community issues, consistent but not official
- WhatsApp Help Center FAQ HTTP 400 — format from search extract of official FAQ
- ANPD analog (cookies/logs) applied to QR scans — interpretation, not a QR-specific ruling

---
*Research completed: 2026-09-21*
*Ready for roadmap: yes*
