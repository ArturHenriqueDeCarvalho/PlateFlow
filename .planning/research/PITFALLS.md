# Pitfalls Research

**Domain:** Internal print-shop QR/NFC dynamic-plate ops (Brazil); brownfield single-admin console → admin-provisioned multi-user with ownership, scoped NFC, campaigns, operational LGPD
**Researched:** 2026-09-21
**Confidence:** HIGH for codebase-confirmed debt (source + `.planning/codebase/CONCERNS.md`); MEDIUM for industry/legal framing (OWASP API Top 10 2023, Lei 13.709/2018, ANPD Res. CD/ANPD nº 2/2022, W3C Web NFC, BCB Pix manual — websearch `--verified` = MEDIUM)

**Scope of this file:** subsequent-milestone mistakes when adding real auth, owner/assignment, scoped NFC, campaigns, hide-IP / export-delete, and keeping public `GET /r/:slug` + Pix/WhatsApp working. Do not treat UI filters, “hide column”, or a new JWT beside the old prefix check as done.

## Critical Pitfalls

### Pitfall 1: Auth theater — signed JWT beside the `mock_token_admin_` bypass

**What goes wrong:**
Teams add `@fastify/jwt` or a `users` table and leave `requireAuth` as `token.startsWith('mock_token_admin_')`. `/api/auth/me` still hydrates a fake admin from the prefix. Dual `localStorage` keys (`nfc_qr_auth_token_v2` and `plateflow_auth_token`) keep serving the old token. `JWT_SECRET` stays listed in `turbo.json` and unread. Login still falls back to compiled `admin@plateflow.com` / `plateflow2026`.

**Why it happens:**
The mutation guard is a string prefix, not a verifier. Comments still say “Supabase Login”. The temptation is “ship users first, swap tokens later.” Anyone who can guess the prefix already has write access to plates, redirects, and templates.

**How to avoid:**
Delete the prefix check in the same change that introduces signed tokens. One `requireAuth`: verify signature, `exp`, and load `userId`+`role` from the server, never from the client body. Fail boot in production if `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` are missing. Collapse to a single storage key. On 401, `logout()` — do not restore `AUTH_USER` from cache when `/api/auth/me` errors (current `verifyAuth` does).

**Warning signs:**
- Grep still finds `mock_token_admin_` after the “auth” phase.
- `Authorization: Bearer mock_token_admin_1` still yields 200 on `PUT /api/redirects/:slug`.
- Login works with the compiled default password when env is unset.
- Two token keys in `App.tsx` / `storageService.ts`.

**Phase to address:**
**Replace forgeable auth** — first. Do not add users, ownership, or NFC scoping on top of a bypass.

---

### Pitfall 2: Client-side “my QRs” while GETs still dump the shop

**What goes wrong:**
The SPA filters `plates.filter(p => p.ownerId === me)` and the dashboard looks isolated. `GET /api/plates`, `/api/redirects`, `/api/templates`, and `/api/analytics` remain unauthenticated `findAll` (today: no `requireAuth` on those GETs). `PUT /api/redirects/:slug`, `PUT /api/plates/:id`, and NFC `nfcWritten` toggles authorize the *function* but not the *object*. OWASP API1:2023 (BOLA) + WSTG bulk-list variant.

**Why it happens:**
The app was a single shared admin. Adding `ownerId` to the type and hiding rows in React is cheaper than scoping every use case. Slugs are guessable (`placa-01`). Assigned users will IDOR-edit someone else’s destination, download their QR art, and read their scan log.

**How to avoid:**
Authorization in the use case, not the component. List queries: `WHERE owner_id = $user OR assigned_to = $user` (admin: no filter). Mutations: load the plate/redirect, then `assertCanManage(user, record)` or 404 (do not 403-with-existence leak if you can avoid it). Never accept `ownerId` from the client on create/update (mass assignment / API3:2023). Tests: user A `GET`/`PUT`/`DELETE` user B’s slug → fail; user A `GET /api/plates` → only A’s recorte.

**Warning signs:**
- `GetPlatesUseCase` still calls `findAll()` with no actor.
- Network tab on a “user” session returns other operators’ slugs.
- `requireAuth` on POST/PUT/DELETE only; GETs still public.
- New `ownerId` column with no index and no query filter.

**Phase to address:**
**Ownership + assignment + scoped APIs** — immediately after real auth. Campaigns and NFC inherit this check; do not invent a second policy.

---

### Pitfall 3: Hide IP in the UI, still return `ip` on the wire (LGPD theater)

**What goes wrong:**
The panel omits the IP column. `DrizzleAnalyticsRepository.mapRow` still sends `ip`, `user_agent`, and `referrer`. `GET /api/analytics` is public today. OWASP API3:2023 (excessive data exposure): “never rely on the client to filter sensitive data.” Lei 13.709/2018 Art. 5º (dado pessoal = informação de pessoa identificada ou identificável); ANPD treats IP as an electronic-communication identifier. Hiding a column is not Art. 12 anonymization.

**Why it happens:**
v1 says “IP não aparece na UI” and teams implement exactly that. `AnalyticsLog.ip` stays on the shared type so the JSON shape does not change.

**How to avoid:**
Server DTO for list/export: `timestamp`, `deviceType`, `source` (`qr`|`nfc`). Do not select `ip` for browser responses. If IP is kept for abuse/rate-limit, store a truncated or HMAC’d value with a server-only key, never map it to `@plateflow/types` consumed by the SPA. Lock GETs behind auth *and* owner scope. Admin UI follows the same DTO — PROJECT.md forbids IP in the panel, not “except for admin.”

**Warning signs:**
- Response JSON for `/api/analytics` still has `"ip":`.
- Type `AnalyticsLog` still has `ip?: string` used by the client.
- Privacy copy says “não coletamos IP” while `ResolveRedirectUseCase` writes `ip`.
- `trustProxy: true` plus first hop of `x-forwarded-for` (spoofable personal data).

**Phase to address:**
**LGPD operational** — but authenticate analytics GETs in the auth/ownership phases so the dump is not public while waiting.

---

### Pitfall 4: Global `requireAuth` breaks printed plates (`GET /r/:slug`)

**What goes wrong:**
Auth is added with a Fastify `onRequest` hook on the whole app. Physical QR/NFC URLs start returning 401 HTML. Or the SPA `/r/:slug` branch in `App.tsx` stays as fallback: visitor hits Vite/`index.html`, `StorageService.getRedirectBySlug` reads empty `localStorage`, UI shows “Placa Não Encontrada” while Postgres has the row. `StorageService.recordClick` POSTs `/api/analytics` which has no POST route.

**Why it happens:**
Print-shop muscle memory: “protect everything.” Public resolve must stay anonymous. The SPA fallback was a host-config bandage (`vercel.json` / `server.ts` `/r/` skip). PROJECT.md: public page must stay server-resolved and campaign/owner-aligned, not localStorage.

**How to avoid:**
Public surface is only `GET /r/:slug` and `GET /api/redirects/:slug/resolve` (no session). Contract test both local `server.ts` and Vercel `inject` for virgin/active/paused/pix/vcard/whatsapp/404. Delete the `clientRedirectSlug` branch from `App.tsx`. Do not put tokens, `ownerId`, or campaign ids in the NFC/QR payload — only `https://{host}/r/{slug}`.

**Warning signs:**
- Scanning a plate opens the login screen.
- Preview/dev without rewrites 404s plates that work in production (or the reverse).
- Public HTML starts using `localStorage` or admin CSS bundles.
- NFC write URL becomes `/r/{slug}?token=...`.

**Phase to address:**
**Harden public `/r/:slug`** — same milestone as ownership, with an explicit “scans still 307/HTML without a cookie” acceptance test. Do this *before* relying on campaign-specific public pages.

---

### Pitfall 5: Non-unique `plates.slug` + prefix upsert silently retargets metal

**What goes wrong:**
`redirects.slug` is unique; `plates.slug` is only `notNull()`. `onConflictDoUpdate` on `plates.slug` already fails or, if a unique is added later without changing minting, lot 2 with prefix `placa` overwrites lot 1’s `placa-01`. The QR already printed and the NFC already written still encode that slug. Destinations, owner, and campaign of the *new* row now answer the *old* physical object. Analytics rows keyed by `redirect_slug` with no FK attach to the usurper.

**Why it happens:**
Batches mint `prefix-NN` in three places (modal, `StorageService`, `CreateBatchPlatesUseCase`) with different `startNumber` rules. Physical identity is treated like a CMS slug you can rename.

**How to avoid:**
Unique `plates.slug` + unique `redirects.slug` in a committed Drizzle migration *before* multi-user inserts. One server mint; include batch id + entropy (`{batch}-{n}-{rand}`), lowercase, persist as printed. Never update slug after print/NFC. On plate delete, either block if `nfcWritten` or tombstone the slug (do not reuse). Normalize lookup to lowercase in the repository.

**Warning signs:**
- Second lot with default prefix `placa`.
- `ON CONFLICT (slug)` errors in API logs.
- Two plates, one slug in inventory.
- NFC scan hits the wrong customer’s Pix.

**Phase to address:**
**Schema/identity for plates** — before ownership assignment and before users create QRs. Blocking for any phase that inserts plates.

---

### Pitfall 6: Multi-user destination editors turn stored XSS + `javascript:` into a shop-wide payload

**What goes wrong:**
`publicRedirectRoutes.ts` interpolates `slug`, `title`, Pix key/name, vCard fields into HTML with no escape. `ensureAbsoluteUrl` accepts any `scheme:` so `javascript:`, `data:`, `file:` become 307 targets. Today only the env-admin can plant this. After assignment, every internal user can. One Pix `pixName` of `<img src=x onerror=...>` runs for every scan of that plate. Campaign landing pages multiply victims.

**Why it happens:**
Operator-trusted fields plus string templates. “Internal tool” is used as a substitute for encoding. Tailwind CDN script on those pages widens the sink.

**How to avoid:**
HTML-entity encode (`& < > " '`) every dynamic field, or a real template engine. Allowlist `http:`/`https:` for URL type; WhatsApp only via `https://wa.me/{digits}`. Reject other schemes at save time, not only at resolve. Inline CSS; drop `cdn.tailwindcss.com`. Tests: payload in title/Pix/vCard does not execute; `javascript:alert(1)` returns 400 on PUT.

**Warning signs:**
- Template literals with `${redirect.title}` in `text/html`.
- User-created Pix/vCard pages in DevTools show raw `<script>`.
- Public pages still load the Tailwind Play CDN.

**Phase to address:**
**Harden public `/r/:slug`** — before users (not just admin) can edit destinations. If ownership ships first, this is an incident waiting for the first assigned operator.

---

### Pitfall 7: `origin: true` + `credentials: true` with real sessions

**What goes wrong:**
`@fastify/cors` `origin: true` reflects any `Origin`. Fastify docs call this a production reflection exploit. Combined with `credentials: true` and a Bearer (or cookie) session, a hostile site can call `/api/plates` as the logged-in gráfica operator. Harmless while tokens are prefix-guessable from anywhere; catastrophic once tokens are real and GETs are authenticated-but-CORS-open.

**Why it happens:**
Dev convenience copied to Vercel. Same-origin SPA (`fetch('/api/...')`) does not need credentialed CORS reflection at all.

**How to avoid:**
Allowlist the production app origin(s) only. Same-origin deployments can disable CORS or use a fixed origin. Never `*` with credentials. Public `/r/` must not require CORS credentials. If you later use httpOnly cookies, add CSRF (`SameSite=Strict` or `@fastify/csrf`); Bearer in `Authorization` from same-origin `fetch` is the smaller change for this SPA.

**Warning signs:**
- `origin: true` still in `app.ts` after auth lands.
- Staging URL plus random origin both get `Access-Control-Allow-Origin: <that origin>` and `Allow-Credentials: true`.

**Phase to address:**
**Replace forgeable auth** — same PR as the token swap, or the new token is stealable the day it ships.

---

### Pitfall 8: Function-level holes — users run the gráfica (BFLA)

**What goes wrong:**
`AuthUser.role` is already `'admin' | 'user'` but middleware is binary “has prefix.” After JWT, a user token still hits `POST /api/plates/batch`, template CRUD, user create/deactivate, other-user delete, campaign-admin lists. OWASP API5:2023 BFLA. Opposite failure: admin-only lot generation is so locked that assigned users cannot create the URL/WhatsApp/Pix/vCard QRs PROJECT.md promises.

**Why it happens:**
Two roles bolted onto routes that were all “the admin.” Batch/templates are print-shop capabilities; destination edit is operator capability. Mixing them in one `requireAuth` is the mistake.

**How to avoid:**
`requireAuth` then `requireAdmin` on: user provisioning, templates, batch/lot, deactivate/delete accounts, global campaign view, LGPD wipe of another user. `requireAuth` + object scope on: create/edit own+assigned redirects, PNG/SVG download of own slugs, NFC write of own slugs, own campaign membership, own analytics. No public signup. Deactivated users: `exp` short + server-side `disabled_at` checked on every request (JWT without revocation is a zombie operator).

**Warning signs:**
- Single `requireAuth` on every `/api/*` except `/r/`.
- User UI hides “Usuários” but `POST /api/users` still 200.
- Disabled user keeps working until token TTL (or forever, if no `exp`).

**Phase to address:**
**Admin-provisioned users** together with **ownership** — define the matrix before building screens.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Filter inventory in React, leave `findAll` | Fast demo of “recorte” | BOLA, LGPD dump, extra work later | Never |
| Hide `ip` in the table, keep JSON field | Matches the literal requirement | API3 + Art. 18 access still exposes IP | Never |
| Keep `mock_token_admin_` “for scripts” | Old curl still works | Bypass is the product | Never |
| `drizzle-kit push` instead of committed migrations | Add `owner_id` in an afternoon | Prod/staging drift; unique slug never lands | Never for uniqueness/FK |
| Campaigns = `batchIdentifier` string | Zero schema | Print lot ≠ marketing campaign; users leak via shared prefix | Only as a temporary *display* alias, not as ACL |
| `nfcWritten` checkbox without read-back | Works without Web NFC | Inventory lies; tags still empty or pointing elsewhere | Dev-only; production needs write+verify URL |
| localStorage write-ahead (`res.ok` ignored) | UI feels instant | Split-brain; 401 looks like saved destination | Never |
| SPA `/r/:slug` fallback | Survives misconfigured host | Public 404s; dual Pix/WhatsApp implementations | Never in this milestone |
| Fire-and-forget analytics insert | Faster 307 | Lost scans; delete-account races; Vercel isolate drop | Not once export/delete is a promise |
| Default admin password in source | Local boot without `.env` | Shipped credential | Never in production builds |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Web NFC (`NDEFReader`) | Write any nearby tag; default overwrite; no owner check on `plateId`; treat `nfcWritten` as truth; expect iOS | HTTPS, user gesture, Chrome/Android only. Server: caller owns/is assigned the slug. Write `https://{host}/r/{slug}` only. Optional `overwrite: false` when retagging virgins. Confirm by reading back the URL before `PUT nfcWritten`. Do not `makeReadOnly()` unless print-shop policy is permanent (irreversible; destination changes still work via `/r/:slug`). |
| Vercel rewrite → Fastify `inject` | Auth/CORS/public route tested only on `tsx server.ts` | Contract-test `/r/:slug` and `/api/auth/me` through `handler` *and* local listen. Multipart templates already diverge. |
| Supabase Postgres (`pg` + Drizzle) | Add `users`/`owner_id` via push; keep `ssl.rejectUnauthorized: false`; pool `max: 10` on serverless | Committed SQL migrations, unique+FK, pooler URL, `max: 1` on Vercel. No `@supabase/supabase-js` Auth. |
| Pix BR Code (BCB / EMV) | Store phone key like `wa.me` (digits, no `+`); `generatePixBrCode` uses point-of-initiation `12` (dynamic) for a static key QR; skip CRC tests; interpolate `pixName` unescaped | Normalize per BCB: phone `+55DDDnumero`, CPF/CNPJ digits only, email as-is, EVP UUID. Name ≤25 / city ≤15 (already sliced). Prefer static `11` unless you emit a dynamic payload URL. Unit-test CRC. Encode HTML separately from EMV payload. |
| WhatsApp `wa.me` | Keep `+` or spaces; drop DDI `55`; skip `encodeURIComponent` on `text`; reuse Pix E.164 (`+55...`) unstripped | Digits only `55DDDnumero`. Message already encoded in `publicRedirectRoutes.ts` — do not double-encode. Validate length so empty phone does not 307 to `https://wa.me/`. |
| CORS / Fastify | `origin: true` left “until frontend CORS issues settle” | Allowlist. Same-origin PWA should not need reflection. |
| `trustProxy` + scan IP | Store `x-forwarded-for` first hop as LGPD data | Fastify `request.ip` with known hop count; prefer not storing raw IP at all in v1 (PROJECT.md: no geo). |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unbounded `findAll` on plates/redirects/templates/analytics after every NFC toggle | Dashboard sync of four full tables | Owner-scoped lists + cursor/limit; do not refetch templates on NFC | Already painful; worse at a few thousand plates / second operator |
| Analytics hard-cap 200 rows, no `GROUP BY` | Device breakdown lies; export incomplete | SQL aggregates for the panel; export as chunked query by slug set | >200 scans/shop — **already true** |
| `localStorage` cache of full inventory + data-URI templates | Quota errors; stale other-user data after login switch | Server as source of truth; per-user cache key or no inventory cache | Two users on one browser; ~5MB quota |
| Unthrottled public scan → `UPDATE`+`INSERT` | Table bloat, IP log growth (LGPD retention) | Rate-limit `/r/:slug` by IP+slug; retain N days | Bot scrapes of printed QR lists |
| Client ZIP/canvas of lots | Tab freeze | Cap quantity in API (e.g. 50); admin-only | Large reprint jobs |
| pg `Pool max: 10` × Vercel isolates | Connection starvation | `max: 1` + transaction pooler | A handful of concurrent scans + dashboard |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Prefix token / compiled default password | Full shop takeover | Signed JWT, no fallback, fail closed |
| Unauthenticated inventory/analytics GETs | Competitor or scanner dumps every plate + IPs | `requireAuth` + owner scope + IP stripped DTO |
| BOLA on `PUT /api/redirects/:slug` and NFC mark-written | Assigned user retargets another’s physical plate | Object-level `assertCanManage` |
| BFLA on batch/templates/users | Operator becomes gráfica | `requireAdmin` matrix |
| CORS reflect + credentials | Token theft from a tab | Origin allowlist |
| Stored XSS / open redirect on `/r/:slug` | Every physical scan is an attack vector | Encode HTML; scheme allowlist |
| `src=nfc` query as analytics source | Anyone can spoof NFC vs QR stats | Best-effort only; do not use for ACL. Optional: distinct NFC URL path later — not v1. |
| Mass-assign `role`, `ownerId`, `nfcWritten` from `req.body as any` | Privilege escalation, fake NFC inventory | Allowlisted patches; controllers stop using `Body: any` |
| Deleting a user without reassigning plates | Orphan physical assets; or cascade-delete printed QRs | Admin reassign or disable-in-place; never silent cascade of slugs |
| Export that includes other users’ campaigns/IPs | LGPD + internal privacy failure | Export = caller’s recorte; admin export is a separate, audited action |
| Login without rate limit | Default-password and user-password stuffing | `@fastify/rate-limit` on `/api/auth/login` |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| NFC UI shown on desktop/iOS as a primary button | “NFC não funciona” tickets | Detect `NDEFReader`; otherwise copy URL + Android Chrome instruction only |
| Write success toast while `PUT` failed (`res.ok` ignored) | Operator ships tags that still 404 | Await server; toast only after persist; re-read tag URL |
| User opens `/r/:slug` from the admin PWA on a rewrite miss | Customer-looking 404 during demos | Server-only public path; preview link should be the real origin |
| Campaign named like the print lot (`placa`) | Users think they own a lot they do not | Separate `campaign` entity; lot stays admin print metadata |
| Assignment with no notification of *which* slugs | User cannot find “their” plates | Inbox of assigned slugs + campaign name |
| Pix key accepted in any format, fails at the banco | Embarrassing payment fail on the plate | Validate type (cpf/cnpj/email/phone/evp) at save; show BR Code preview |
| WhatsApp without DDI | Scan opens a non-Brazilian or invalid chat | Force `55` + DDD in the form |
| Privacy policy only in the admin footer | Scanner never sees it; Art. 9º transparency gap | Link from public HTML (even operational v1) + in-app settings |
| Export/delete with no confirmation of *what* dies | Admin wipes analytics they needed; user thinks account delete unprints plates | Copy: deletes readings/account, not the metal; printed slug still resolves unless paused |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Auth:** `mock_token_admin_` gone from middleware *and* `AuthController.me`; no compiled default password; `exp` + disable check; single token key; 401 clears session — verify with a forged prefix and with env unset.
- [ ] **Users:** Admin can create/deactivate; no public `POST /register`; deactivated user cannot NFC or PUT — verify second browser session.
- [ ] **Ownership:** User A cannot list/edit/NFC/download/analytics of user B even with a guessed `placa-01` — verify at HTTP, not UI.
- [ ] **Assignment:** Admin assign adds to recorte; unassign removes; create-by-user still owned after unassign rules are explicit — verify both directions.
- [ ] **GETs authenticated:** `/api/plates|redirects|templates|analytics` 401 without token — verify curl without cookies.
- [ ] **IP:** Not in JSON, not in CSV export, not in UI, including admin — verify response schema.
- [ ] **Export/delete:** Deletes analytics for that user’s slugs (and account fields); does not reuse slugs; does not 401 `/r/:slug` — verify scan after delete.
- [ ] **Public `/r/:slug`:** Works without auth through Vercel rewrite *and* local host; SPA fallback removed; Pix/WhatsApp/vCard still resolve — verify physical-style GET.
- [ ] **Slug unique + lowercase:** Second lot cannot steal `placa-01`; `Placa-01` and `placa-01` are one plate — verify migration + resolve.
- [ ] **XSS/schemes:** Hostile title/Pix/vCard/URL saved as user cannot execute or `javascript:`-redirect — verify HTML source.
- [ ] **CORS:** Random origin does not get credentials — verify preflight.
- [ ] **NFC:** User cannot `PUT nfcWritten` on another plate; write payload is `/r/{slug}` not a tokenized URL — verify API + modal.
- [ ] **Campaigns:** Not `batchIdentifier`; user sees only campaigns they belong to; admin sees all — verify list API.
- [ ] **Pix vs WhatsApp phones:** Pix phone has `+55`; wa.me has digits `55...` — verify fixtures.
- [ ] **Client persistence:** Failed PUT does not keep localStorage success — verify 403 path.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Mock token still accepted in prod | HIGH | Rotate `JWT_SECRET` if any real tokens issued; deploy middleware that rejects `mock_token_*`; force logout; audit `updated_at` on redirects during the window |
| Public analytics/IP dump | HIGH | Take GETs behind auth immediately; treat as incident under LGPD (assess, document, notify if risk is relevant); purge or hash stored IPs; do not pretend the UI hide was enough |
| Slug collision / overwritten lot | HIGH | Stop minting; add unique constraint; reprint or NFC-rewrite affected physical plates; do not “fix” by renaming slug under existing QR |
| SPA fallback 404s on scans | MEDIUM | Fix host rewrites; remove SPA branch; keep `/r/` on Fastify; smoke-scan a virgin and an active plate |
| XSS planted in a user Pix/vCard | HIGH | Escape renderer; sanitize existing metadata; pause compromised slugs; treat as stored XSS incident |
| CORS token theft | HIGH | Allowlist origins; revoke tokens (short TTL + denylist `disabled_at`); check logs for cross-origin `Origin` |
| User BOLA edits | MEDIUM | Revert destinations from `updated_at`/backups; add object checks; notify plate owners |
| Incomplete account delete | MEDIUM | Run a second pass: `analytics` by slug set, `localStorage` instructions, backups note; pause slugs if the titular was the destination subject (Pix name/phone) |
| NFC written to the wrong tag | LOW–MEDIUM | Re-write correct slug; do not lock read-only until verified; inventory flag is not the tag |
| Global auth broke `/r/:slug` | MEDIUM | Exempt public routes; hotfix; regression test before more auth work |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Mock token / default password / dual keys / session cache on error | Replace forgeable auth | Forged prefix 401; env-less boot refuses prod; `/me` needs valid signature |
| CORS `origin: true` + credentials | Replace forgeable auth | Foreign origin preflight fails; same-origin SPA login still works |
| Unauthenticated GETs | Replace forgeable auth (lock) then ownership (scope) | curl GET `/api/plates` 401; user GET only recorte |
| BFLA (users hitting batch/templates/user-admin) | Admin-provisioned users | User token 403 on admin routes; admin token 200 |
| BOLA / ownerId mass assignment / UI-only filter | Ownership + assignment | Cross-user PUT/NFC/GET fail at API |
| Assignment orphans / cascade-delete printed slugs | Ownership + assignment | Unassign keeps slug resolving; user disable ≠ plate delete |
| Global auth or SPA fallback breaks scans | Harden public `/r/:slug` | Unauthenticated 307/HTML for url/whatsapp/pix/vcard; no `App.tsx` `/r/` branch |
| Stored XSS + `javascript:` + Tailwind CDN | Harden public `/r/:slug` | Encoded HTML; scheme 400; no CDN script |
| `plates.slug` not unique; prefix collision; case mismatch | Schema/identity (before user-created QRs) | Unique index exists; second `placa` lot cannot steal; lowercase resolve |
| NFC write without ownership; checkbox lie; iOS promise | Scoped NFC | Cross-user `nfcWritten` 403; payload is `/r/{slug}`; iOS copy-URL path |
| Campaigns = `batchIdentifier` leak | Campaigns as entity | User campaign list ≠ all lots; ACL uses membership not prefix |
| Hide-IP UI / IP in JSON / spoofed `x-forwarded-for` | LGPD operational | Schema has no `ip`; admin panel neither; optional hash not in types |
| Export/delete misses analytics, UA, account, localStorage | LGPD operational | After delete, `/api/analytics` for those slugs empty; `/r/:slug` still 200/307 unless paused |
| Pix/WhatsApp phone format; EMV `12` vs static; untested CRC | Destinations (with ownership edit) | Fixtures: Pix `+55...` pays; wa.me `55...` opens; CRC matches BCB |
| `findAll` + 200-row analytics lie | Ownership lists + analytics query | Panel uses aggregates; export not capped at 200 |
| `res.ok` ignored / localStorage split-brain | Client source-of-truth (with auth) | 403 does not toast success |
| Fire-and-forget click log vs delete race | Public resolve + LGPD | Await analytics insert or queue; delete waits for in-flight writes |

**Phase ordering rationale (do not invert):**
1. Kill bypass + CORS + lock GETs — otherwise every later feature is a larger blast radius.
2. Unique slugs + public `/r/:slug` contract — otherwise users print collisions and auth work 404s metal.
3. Users + object ACL — otherwise “recorte” is a CSS trick.
4. NFC scope — depends on ACL and stable slug URL.
5. Campaigns — depends on ACL; do not reuse batch ids.
6. LGPD DTO/export/delete — depends on auth so you are not exporting a public table; IP strip can start as soon as analytics GETs exist.
7. Pix/WhatsApp validation — already in prod; harden when users (not only admin) edit destinations, same phase as XSS.

**Research flags for later phases:**
- LGPD: operational v1 is policy + auth + hide/strip IP + export/delete. Consent-on-scan and retention jobs are out of scope; do not silently expand.
- NFC `makeReadOnly()` vs dynamic destination: policy choice for print-shop, not a security boundary for `/r/:slug`.
- ANPD small-agent (Res. 2/2022) doubles *deadlines*, it does not waive Art. 18 — do not plan “skip export because gráfica pequena.”

## Sources

**Codebase (HIGH — first party, 2026-09-20 map + 2026-09-21 re-read):**
- `.planning/codebase/CONCERNS.md` — mock token, public GETs, XSS, slug unique, SPA `/r/:slug`, CORS, IP, `trustProxy`
- `apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts`
- `apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts`
- `apps/plateflow-api/src/infrastructure/http/app.ts` (`origin: true`, `trustProxy`)
- `apps/plateflow-api/src/infrastructure/http/routes/plateRoutes.ts`, `analyticsRoutes.ts`, `publicRedirectRoutes.ts`
- `packages/database/src/schema/index.ts` (`plates.slug` not unique; `analytics.ip`)
- `apps/plateflow-app/src/App.tsx` (SPA `/r/` fallback, dual token keys)
- `apps/plateflow-app/src/services/storageService.ts` (localStorage, `verifyAuth` cache)
- `apps/plateflow-app/src/components/NfcAssistantModal.tsx` (unconditional overwrite write)
- `apps/plateflow-api/src/infrastructure/services/PixCodeService.ts` (EMV `12`, name/city slice, no phone `+55` normalize)

**Authorization / XSS / CORS (MEDIUM — official docs, cross-checked):**
- OWASP API1:2023 BOLA — https://github.com/OWASP/API-Security/blob/master/editions/2023/en/0xa1-broken-object-level-authorization.md
- OWASP WSTG API BOLA (bulk list) — https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/12-API_Testing/02-API_Broken_Object_Level_Authorization/
- OWASP API5:2023 BFLA — https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/12-API_Testing/04-API_Broken_Function_Level_Authorization
- OWASP API3:2023 BOPLA / excessive data exposure — https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/
- OWASP XSS Prevention Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- `@fastify/cors` (origin reflection not for production) — https://github.com/fastify/fastify-cors
- `@fastify/jwt` cookie/CSRF notes — https://github.com/fastify/fastify-jwt/

**LGPD (MEDIUM — statute + ANPD):**
- Lei nº 13.709/2018 Arts. 5º, 12, 15, 16, 18 — https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- ANPD FAQ 6.6 elimination (updated 2024-08-15) — https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-frequentes/6-direitos-dos-titulares-de-dados/6-6-2013-em-quais-situacoes
- Resolução CD/ANPD nº 2/2022 Arts. 6, 7, 14 (small agents still owe Art. 18) — https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022
- ANPD aviso de privacidade treating IP as communication identifier — Resolução CD/ANPD nº 9/2023 (institutional processing inventory)

**NFC (MEDIUM — W3C / Chrome):**
- W3C Web NFC — https://w3c.github.io/web-nfc/
- Chrome Android Web NFC (overwrite, `makeReadOnly`, HTTPS, no iOS) — https://developer.chrome.com/docs/capabilities/nfc
- MDN `NDEFReader.write()` — https://developer.mozilla.org/en-US/docs/Web/API/NDEFReader/write

**Pix / WhatsApp (MEDIUM — BCB + Bacen issues):**
- Banco Central, Manual de Padrões para Iniciação do Pix (BR Code, key formats, `+55` phones) — https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf
- bacen/pix-api#189 (CRC / EMV field length rejections)

**Gaps (not claimed as settled):**
- Whether this gráfica qualifies as ANPD “agente de pequeno porte” (fact-specific; does not change the engineering pitfalls).
- Whether v1 should hash IP at rest vs stop collecting — PRODUCT says hide + no geo; collecting remains tratamento.
- NFC lock (`makeReadOnly`) vs reprint policy — print-shop decision, not a substitute for `/r/:slug` authz.

---
*Pitfalls research for: PlateFlow internal QR/NFC plate ops (Brazil), subsequent milestone*
*Researched: 2026-09-21*
