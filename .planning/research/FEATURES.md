# Feature Research

**Domain:** Internal multi-user dynamic QR/NFC plate ops (print shop, Brazil) — not public SaaS
**Researched:** 2026-09-21
**Confidence:** MEDIUM

This landscape is for **this v1** of PlateFlow: an internal gráfica tool where an admin runs the shop, and provisioned users operate only the QRs they created or were assigned. Public SaaS table-stakes (billing, geo maps, self-serve signup, iOS NFC apps) are **anti-features here**, even though competitors sell them.

**How this domain actually works (expected behavior):**

1. **Stable public URL, mutable destination.** The printed QR and the NFC chip encode `/r/:slug` (NFC should add `?src=nfc`). The destination (URL, WhatsApp, Pix, vCard) lives on the server and can change without reprinting or rewriting — same pattern as Bitly/Uniqode dynamic codes and Kitetags/ixkio NFC redirects.
2. **Custody, not a shared library.** Marketing QR SaaS (QR TIGER, Uniqode Business) usually shares a folder or whole org. NFC/print-shop tools (NFCTagify, ixkio, ZAPPED) assign **each physical asset** to a person. PlateFlow must follow the second model: list/edit/NFC/analytics are scoped to `created_by ∪ assigned_to`; admin sees everything and can reassign.
3. **Campaigns are filters, not print lots.** Uniqode/QR TIGER folders are campaign containers with rollup analytics. PlateFlow already has `batchIdentifier` for shop lots. v1 campaigns are a named grouping of QRs for the operator; they must not replace lots/templates, and deleting a campaign must not trash the codes (Uniqode folder-delete does — do not copy that).
4. **QR vs NFC is a write-time marker, not UA sniffing.** `GET /r/:slug` already maps `?src=nfc` → source `nfc`, else `qr`. The current Web NFC write uses `/r/{slug}` **without** the query — NFC taps will be counted as QR until that is fixed. Device type from User-Agent is table stakes; IP geolocation is not.
5. **LGPD operational, not a consent theater.** Lei 13.709/2018 Art. 5 treats identifiable data (including IP in logs) as personal; Art. 9 requires a clear notice; Art. 18 requires access/export and elimination of unnecessary data. Hide IP in the UI, authenticate inventory GETs, ship a privacy policy and export/delete. Do **not** block `/r/:slug` behind a cookie banner.

## Feature Landscape

### Table Stakes (Users Expect These)

Features operators assume exist. Missing these = the internal tool feels broken or unsafe.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Admin-only user provisioning (create + deactivate; no public signup) | Internal shop: nobody should join from the internet. Uniqode/QRLynx invite teammates; an **ops** console goes further and never exposes `/signup`. | MEDIUM | Expected: admin sets email, name, initial password (or one-time set-password link **inside** the org). Deactivate blocks login; QRs keep resolving until admin reassigns. Do not copy SaaS “accept invite then create a Uniqode account”. |
| Real signed session/JWT (replace `mock_token_admin_*`) | Mutations already send Bearer tokens; a guessable prefix is a bypass. Table stakes for any multi-user console. | MEDIUM | Login, logout, `/me`, password change. Two roles only: `admin` \| `user`. Default env credentials must not remain as the only identity. |
| Per-QR ownership + admin assignment | Uniqode Editors already “see and modify only their resources”; NFC card platforms assign one card → one profile and allow admin reassignment. Shop users must not see other clients’ plates. | HIGH | Expected: `ownerUserId` on redirect/plate; user slice = created **or** assigned; admin can assign/unassign/transfer; creating a QR in the user console auto-owns it. Server enforces on **every** list/update/NFC/analytics route — UI hide is not enough. |
| Isolated listing + isolated NFC write | Writing the wrong client’s chip is an irreversible shop error. Chrome Web NFC will write **any** URL the page asks for; authorization is the product’s job. | MEDIUM | Expected: NFC assistant only offered for slugs in the caller’s slice; API rejects `nfcWritten` / write-intent for others. Chrome Android, HTTPS, user gesture (`NDEFReader.write`). Show a clear “use Chrome on Android” state on desktop/iOS. |
| NFC URL encodes `/r/{slug}?src=nfc` | QR vs NFC analytics is a v1 requirement. Same URL cannot tell tap from scan (Linked.Codes / hybrid NFC+QR practice: distinct marker). Existing resolver already reads `src=nfc`. | LOW | Gap vs current code: `NfcAssistantModal` writes `/r/{slug}` with no query, so taps log as `qr`. PNG/SVG QR should keep `/r/{slug}` (no `src`, defaults to `qr`). |
| User creates/edits URL, WhatsApp, Pix, vCard in their slice | Dynamic QR products are incomplete without post-print destination edit. Brazil shop operators expect WhatsApp (`wa.me`), Pix, and vCard — already in the codebase. | MEDIUM | Expected per type below. `social` exists in types but is **not** a v1 requirement — do not expand. Virgin → active on first real destination; paused stops public resolve. |
| Public `GET /r/:slug` as source of truth | Scanners must never depend on SPA `localStorage`. Bitly/Uniqode encode a short URL; the server decides. | MEDIUM | Expected: URL/WhatsApp → 307; Pix → HTML with BR Code; vCard → HTML + `.vcf`; 404 / virgin / paused HTML. No PII on the public page. Align copy with campaign/owner only if it does not leak other clients. |
| WhatsApp destination via official click-to-chat | Operators expect scan → chat, not a generic URL field they have to remember. | LOW | Official format: `https://wa.me/{digits}?text={urlencoded}` (WhatsApp Help Center). Digits only, international, no `+`/dashes. 307 to that URL. |
| Pix landing with merchant-presented BR Code | Camera apps do not treat a marketing redirect as Pix. BCB BR Code is EMV MPM; payers scan the **payload**, not a website. | MEDIUM | Expected: public HTML shows EMV string + on-page QR (already `PixCodeService`). Do not encode raw EMV into the **printed plate** QR if the plate must stay dynamic. Amount/name/city/key editable after print. |
| vCard landing + downloadable `.vcf` | Dynamic contact QRs open a page so the owner can change name/phone later; static `BEGIN:VCARD` in the printed code cannot. | LOW | Expected: HTML with fields + “Salvar contato”; `.vcf` (vCard 3.0). Same slug stays stable. |
| PNG **and** SVG download of the QR | Print shops treat SVG as the print master; PNG is for WhatsApp/email proofs. Generators that only offer PNG feel amateur on a gráfica floor. | LOW | Expected: download encodes the public short URL (not the final destination). SVG for plate/art; PNG ~1024px+ for screen. Fancy eyes/logos are not table stakes. Plate ZIP art stays **admin**/existing batch flow. |
| Campaigns as QR grouping (scoped) | Uniqode folders / QR TIGER campaign folders: name a set, filter list, roll up scans. Operators will invent naming chaos without this. | MEDIUM | Expected: campaign has name + member QR slugs (or IDs). Admin sees all; user sees campaigns that contain at least one QR in their slice (or that they created). Add/remove QRs they own. **Do not** cascade-delete QRs when deleting a campaign. **Do not** reuse `batchIdentifier` as the campaign — lots are shop production, campaigns are operator grouping. |
| Analytics by date, device, QR vs NFC — slice only | Bitly/QR TIGER/Uniqode dashboards: totals, time series, device/OS. This shop also has hybrid plates, so **source** is required. Geo is what SaaS upsells; v1 explicitly excludes it. | MEDIUM | Expected: filters date range; breakouts device (iOS/Android/Desktop/Outro) and source (`qr`/`nfc`); per-QR and per-campaign rollup; user cannot query others’ slugs. `GET /api/analytics` (and inventory GETs) require auth. |
| Authenticated inventory GETs + IP hidden in UI | Today GETs dump plates/redirects/analytics including IP — LGPD exposure if the API is reachable. Art. 5: IP can identify a natural person. | LOW | Store IP server-side if needed for abuse/legal; **never** render or return it to the browser in v1. User-Agent may be summarized as device only. |
| Privacy policy (public) | Art. 9: treatment must be explained clearly. ANPD treats missing policy/encarregado contact as a complaint trigger. | LOW | Public page: what is collected on scan (timestamp, UA/device, source, IP stored), purpose (ops metrics), legal basis (legitimate interest for operational analytics — not marketing cookies), how to request export/delete, who is the controller (the gráfica). Link from `/r/:slug` footer and login. |
| Export + delete scan logs; admin can delete/deactivate accounts | Art. 18: access/portability and elimination of unnecessary data. Internal users will ask “apaga as leituras deste cliente”. | MEDIUM | Expected: CSV/JSON export of **non-IP** events for slugs in scope; delete events for a QR or user; admin deactivates/deletes the **account**. Public scans keep working after account deactivate until destinations are paused. No self-serve public “delete my scan” on `/r/:slug` in v1. |

### Differentiators (Competitive Advantage)

Not required to look like Bitly. These are why a **gráfica internal tool** beats pasting Uniqode seats.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Per-asset custody (own + admin assign) instead of org-wide library | Client isolation without multi-tenant SaaS. NFCTagify/ZAPPED pattern: one plate → one operator; admin reassigns when the client or salesperson changes. Uniqode is folder/collaborator oriented; the shop needs **inventory custody**. | HIGH | This **is** the core value. Ship it before prettier dashboards. Show “criado por / atribuído a” only to admin. |
| Hybrid plate: same slug for printed QR + NFC chip | Unique vs pure QR SaaS (no chip) and pure NFC vendors (weak QR analytics). One destination, two physical channels, comparable counts. | MEDIUM | Differentiator only if `?src=nfc` is actually written. Keep `nfcWritten` as shop QA flag (gráfica floor), separate from scan source. |
| Brazil destinations (WhatsApp, Pix, vCard) as first-class types | Global QR tools treat these as “URL you paste”. Local operators think in chave Pix / wa.me / cartão. QRLynx already documents Pix EMV + WhatsApp + vCard as types. | LOW | Already in product; keep parity under the new owner rules. Do not add PIX copia-e-cola as a separate type. |
| Print-lot console stays admin (templates, batch ZIP, plate art) | Competitors are marketing clouds. The gráfica already generates lots with QR stamped on art. Users should not wander into production. | MEDIUM | Differentiator by **restraint**: user v1 = destinations, campaigns, downloads, NFC, readings. Admin keeps `BatchGeneratorModal` / templates. Optional later: admin assigns a whole lot to a user in one action. |
| Operational LGPD (hide IP, export/delete) without geo or consent walls | QR TIGER pairs scan location with privacy-vendor copy. Blocking `/r/:slug` with a cookie banner would kill plate UX and is the wrong control for server logs. | MEDIUM | Honest minimization beats fake GDPR banners. Policy + auth + export/delete is the differentiator vs dumping IP in the dashboard. |
| SVG QR download beside plate art | Agencies download PNG; a print shop needs vectors **and** already has PNG/ZIP plate composites. Both in one console is rare. | LOW | Do not replace plate ZIP with QR-only SVG. Offer both. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems **in this v1**.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Public signup / self-serve seats / multi-tenant SaaS | “That’s how Uniqode onboards teammates.” | Turns an internal ops tool into an attack surface and a product you are not selling. Invite-then-create-account still is public identity. | Admin creates and deactivates users only. |
| Billing, plans, paywall, feature gates at plan end | Competitor default; leftover from an older SaaS framing. | No revenue model in this milestone; paywalls fight internal adoption. | Omit entirely. Capacity = shop process, not meters. |
| Geolocation (city/UF via IP or GPS) | Bitly/QR TIGER/Uniqode dashboards lead with maps. | Extra LGPD surface, IP→geo databases, and it was explicitly deferred. GPS on `/r/:slug` needs consent and breaks 307. | Date + device + QR/NFC source only. |
| iOS NFC write (Web NFC) | “iPhone is half the floor.” | Chrome docs: Web NFC is Android Chrome 89+. iOS browsers use WebKit; NFC write needs Core NFC **native app**. | Document Android Chrome; optional later native writer — not v1. Desktop: copy URL + USB writer, not fake Web NFC. |
| Scan-time consent banner + automatic retention jobs | “LGPD pesada” / copy ANPD cookie banners. | `/r/:slug` is a redirect, not a cookie wall. Consent-for-logs is the wrong basis; banners add bounce. Auto-purge without a policy is easy to get wrong. | Privacy policy + legitimate interest for ops analytics; export/delete on request; retention later. |
| Shared org library / four SaaS roles (Owner/Admin/Editor/Viewer) | Matches Uniqode/QRLynx help articles. | Shop needs two roles and **per-QR** isolation. Viewer/Editor/billing-Owner is SaaS complexity. | `admin` (everything) and `user` (slice). |
| Campaign delete that trashes member QRs | Uniqode: delete folder → codes stop working. | Physical plates in the wild would 404. Catastrophic for a gráfica. | Delete campaign membership only; codes stay. |
| Collapsing campaigns into `batchIdentifier` | “We already have lots.” | Lots are production (template, quantity, ZIP). A salesperson campaign is a different axis and would leak shop naming into client grouping. | New campaign entity; lots remain admin. |
| Encoding Pix EMV or vCard directly in the printed QR | “Bank apps like native Pix QR.” | Static payload: cannot change destination; analytics/NFC hybrid break; plate reprint required. | Always encode `/r/:slug`; Pix/vCard on the **landing**. |
| `NDEFReader.makeReadOnly()` / lock chip | Chrome 100+ can lock tags; conferences lock badges. | Irreversible; slug typo or `/r` host change bricks the plate. | Leave tags writable in v1; rewrite when assigning. |
| Custom domains, UTM builders, GA4, bot filtering, A/B geo-routing | Bitly/Uniqode enterprise checklists. | Not the success metric; delays ownership. | Single host `/r/:slug`; optional UTM on the **destination** URL the user pastes. |
| Showing raw IP, full UA, or referrer in the UI | Debug scans. | LGPD display of personal data with no operator need. | Device enum + source + time. Keep IP in DB only. |
| Public “request my data” on the scan page | Literal Art. 18 UX. | Scan is anonymous; no login to prove titularidade. Easy abuse (wipe a campaign). | Policy points to the gráfica; admin fulfills export/delete. |
| Expanding `social` type, Gemini, real-time websockets | Code already has `social`; “AI” was declared unused. | Out of v1; distracts from auth/ownership. | Leave `social` unread; no new types. |
| SSO/SAML, audit-log product, comments on QRs | Uniqode/QR Dex enterprise. | Wrong scale (one shop). | Admin user list + assignment history later if needed. |

## Feature Dependencies

```
Real auth (signed session)
    └──requires──> Admin user provisioning
                       └──requires──> Per-QR ownership + assignment
                                          ├──requires──> Isolated lists / NFC / analytics
                                          ├──requires──> User create/edit URL·WhatsApp·Pix·vCard
                                          └──enhances──> Campaigns (scoped)

Public /r/:slug resolver
    ├──requires──> Destination types (URL 307, wa.me 307, Pix HTML, vCard HTML)
    ├──enhances──> NFC write of /r/{slug}?src=nfc
    └──enhances──> PNG/SVG encode the same URL (QR without src)

NFC write (Chrome Android)
    └──requires──> Ownership check
    └──requires──> ?src=nfc on written URL   (else QR vs NFC analytics is a lie)

Campaigns
    └──requires──> Ownership (member QRs must be in slice)
    └──enhances──> Analytics rollup by campaign
    └──conflicts──> Treating batchIdentifier as campaign
    └──conflicts──> Cascade-delete QRs with campaign

Analytics (date / device / source)
    └──requires──> Auth on GET
    └──requires──> Slice filter
    └──requires──> Source marker on NFC URL
    └──conflicts──> Returning IP to the client

LGPD ops (policy, hide IP, export/delete)
    └──requires──> Auth + scoped analytics
    └──conflicts──> Cookie banner on /r/:slug
    └──conflicts──> Geo from IP
```

### Dependency Notes

- **Auth requires provisioning:** There is no user slice until admin-created accounts exist. Do not ship ownership on top of `mock_token_admin_*`.
- **Isolation requires ownership:** NFC, downloads, campaigns, and analytics are all the same authorization question: “is this slug in the caller’s slice?” Implement once (policy helper), reuse everywhere.
- **NFC `?src=nfc` enhances analytics:** Resolver already understands it; write path must emit it or the QR vs NFC chart is false.
- **Campaigns enhance analytics; they conflict with lots:** Folder-as-campaign is the Uniqode/QR TIGER pattern. Print `batchIdentifier` is a different object. Do not merge in v1.
- **LGPD export/delete requires scoped logs:** Otherwise a user export is a dump of the whole shop.
- **Public resolve must stay unauthenticated:** Auth on `/r/:slug` would brick every plate. LGPD controls belong on the **console**, plus a public policy link.

## MVP Definition

### Launch With (v1)

Minimum to prove: *admin creates users; each operates only their slice; scan and destination edit work end to end.*

- [ ] Signed auth + admin create/deactivate users (no public signup)
- [ ] Owner + admin assignment; all list/update/NFC/analytics routes scoped
- [ ] User create/edit URL, WhatsApp, Pix, vCard in slice
- [ ] Public `/r/:slug` (307 / Pix HTML / vCard HTML) — not SPA localStorage fallback as the real path
- [ ] NFC write only for owned/assigned slugs; payload `/r/{slug}?src=nfc` (Chrome Android)
- [ ] Campaigns as grouping (no cascade delete; not lots)
- [ ] PNG + SVG download of the QR
- [ ] Analytics: date, device, QR vs NFC; auth; IP not in UI
- [ ] Privacy policy + export/delete logs + admin account deactivate/delete

### Add After Validation (v1.x)

- [ ] Admin assigns an entire print lot to a user in one action — trigger: shop is assigning plates one-by-one
- [ ] Password reset / first-login forced change — trigger: more than a handful of operators
- [ ] Campaign-level analytics comparison (Uniqode “compare groups”) — trigger: operators run parallel client campaigns
- [ ] Retention window for analytics (90/180 days) — trigger: table growth or a legal hold policy
- [ ] Assignment audit (who had this plate when) — trigger: disputes after salesperson turnover

### Future Consideration (v2+)

- [ ] Billing / public SaaS / self-serve — out of this milestone’s business model
- [ ] Geolocation — explicit v1 cut
- [ ] iOS NFC via native Core NFC — platform limitation, not a web checkbox
- [ ] Scan consent / cookie CMP / DPO portal — “LGPD pesada”
- [ ] Custom domain, GA4, bot filtering, SSO
- [ ] `makeReadOnly` chip lock
- [ ] `social` destination type as a productized feature

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Signed auth (kill mock token) | HIGH | MEDIUM | P1 |
| Admin create/deactivate users | HIGH | MEDIUM | P1 |
| Per-QR owner + assignment + slice enforcement | HIGH | HIGH | P1 |
| Auth on inventory/analytics GETs | HIGH | LOW | P1 |
| User edit URL / WhatsApp / Pix / vCard in slice | HIGH | MEDIUM | P1 |
| Public `/r/:slug` as only scan path | HIGH | MEDIUM | P1 |
| NFC write gated + `?src=nfc` | HIGH | LOW | P1 |
| Hide IP in UI | HIGH | LOW | P1 |
| PNG + SVG QR download | HIGH | LOW | P1 |
| Campaign grouping (scoped, no cascade) | MEDIUM | MEDIUM | P1 |
| Analytics date / device / source (scoped) | HIGH | MEDIUM | P1 |
| Privacy policy page | MEDIUM | LOW | P1 |
| Export/delete scan logs + admin delete account | MEDIUM | MEDIUM | P1 |
| Assign whole lot to user | MEDIUM | LOW | P2 |
| Forced password change / reset | MEDIUM | MEDIUM | P2 |
| Campaign comparison charts | LOW | MEDIUM | P2 |
| Analytics retention job | LOW | MEDIUM | P2 |
| Assignment history | LOW | MEDIUM | P3 |
| Geo, billing, public signup, iOS NFC, consent wall | LOW* | HIGH | P3 / never in this milestone |

\*Low **for this v1** — high in public SaaS. Do not prioritize them here.

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Uniqode (Beaconstac) | QR TIGER / Bitly | NFC card / tag ops (NFCTagify, ixkio, ZAPPED) | Our Approach |
|---------|----------------------|------------------|-----------------------------------------------|--------------|
| How users join | Admin email invite; invitee may **create a Uniqode account** | Team invite on paid plans; shared dashboard | Admin links cards to profiles; company-controlled URL | **Admin creates internal users only. No public signup.** |
| Who sees which codes | Admin: all. Editor: own + shared collaborators. Folders shared. | Folders shared as viewer/editor (QR TIGER Enterprise) | Per-card assignment; admin reassigns | **Per-QR owner + admin assignment. User slice = created ∪ assigned. Admin: all.** |
| Roles | Owner / Admin / Editor / Viewer (+ billing on Owner) | Owner/Admin/Editor/Viewer variants | Admin vs member/profile owner | **Two roles. No billing role.** |
| Campaigns | Folders + labels; folder analytics; **delete folder trashes codes** | Folders as campaign compartments | Folders / tag groups / batches at tag level | **Campaign entity grouping QRs. No cascade delete. Distinct from print lots.** |
| Destinations | Many marketing types + landing pages | URL + many types; Bitly is URL-centric | Usually one redirect URL / profile | **URL, WhatsApp (`wa.me`), Pix landing, vCard landing. Keep `social` frozen.** |
| Public scan | Short URL redirect + optional landing | Short URL; stats on dynamic codes | Chip stores stable URL; server maps destination | **`GET /r/:slug`. 307 for URL/WhatsApp; HTML for Pix/vCard.** |
| NFC | Not the core product | Rare | Write/lock/assign tags; rewrite vs redirect debated | **Web NFC Android writes `/r/{slug}?src=nfc`. Do not lock. Server auth on slug.** |
| Downloads | PNG/SVG/bulk folder download | PNG/SVG common | Less about QR files | **PNG + SVG of QR for users; plate PNG/ZIP stays admin.** |
| Analytics | Time, device, location, campaign; group compare on Business+ | Date, device, OS, **location**, referrer | Tap counts; richer if redirect layer exists | **Date, device, QR vs NFC. No geo. Slice-scoped. Auth required.** |
| Privacy | Marketing privacy + location; cookie vendors mentioned (QR TIGER) | Location-heavy dashboards | Custody/offboarding of cards | **Policy + hide IP + export/delete. No consent gate on scan. No geo.** |
| Billing | Plan-gated seats | Plan-gated | Hardware + platform | **Out of v1.** |

## Sources

Competitor / domain products (MEDIUM — websearch, cross-checked):

- Uniqode invite + roles (Editor = own resources; Admin = all): https://docs.uniqode.com/en/articles/8643110-invite-a-team-member-to-collaborate-on-uniqode (7 Nov 2025)
- Uniqode folders (campaign grouping; folder delete trashes codes): https://docs.uniqode.com/en/articles/12380574-organize-your-qr-codes-with-folders
- Uniqode owner filter + collaborators: https://docs.uniqode.com/en/articles/8885163-how-to-find-qr-codes-with-filters · https://docs.uniqode.com/en/articles/12146812-collaborate-on-qr-codes-with-editors
- QR TIGER folders as campaigns + share viewer/editor: https://www.qrcode-tiger.com/qr-code-folder
- QR TIGER analytics (time, device, location, CSV): https://www.qrcode-tiger.com/qr-code-analytics
- Bitly QR analytics (date, device, OS, location): https://bitly.com/pages/products/qr-codes · https://bitly.com/blog/dynamic-qr-codes/
- NFCTagify card ↔ profile assign/reassign: https://nfctagify.com/pages/help-03-connect-nfc-card
- ixkio tag-level multiuser + dynamic links: https://ixkio.com/
- ZAPPED team NFC custody / offboarding: https://zapped.to/blog/team-nfc-business-cards
- QR vs NFC source must be encoded at the redirect: Linked.Codes short-link + QR integration posts; Proud Tek hybrid `utm_source=nfc` vs `qr`

Official / standards (fetched; classify-confidence seam still MEDIUM/LOW for webfetch — treat legal text as primary, interpretation as MEDIUM):

- LGPD Lei nº 13.709/2018 Art. 5, 9, 18: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- ANPD cookie/analytics guidance (legitimate interest vs consent; transparency): https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf
- Chrome Web NFC (Android Chrome 89+, HTTPS, user gesture, `NDEFReader.write`): https://developer.chrome.com/docs/capabilities/nfc
- MDN Web NFC (experimental, not Baseline): https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API
- WhatsApp click-to-chat `https://wa.me/{number}?text=`: https://faq.whatsapp.com/5913398998672934 (Help Center; fetch of the FAQ URL returned 400, confirmed via search snippet)
- Banco Central Pix initiation / BR Code (EMV MPM, static key in tag 26): https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf
- EMVCo merchant-presented QR is payment payload, not a generic URL: https://www.emvco.com/emv-technologies/qr-codes/

Existing PlateFlow behavior (codebase map 2026-09-20):

- Resolver source: `apps/plateflow-api/src/infrastructure/http/routes/publicRedirectRoutes.ts` (`src=nfc` vs default `qr`)
- NFC write URL missing query: `apps/plateflow-app/src/components/NfcAssistantModal.tsx`
- Types already include `admin` \| `user`, destinations, `AnalyticsLog.source`
- Print lots: `batchIdentifier` — keep as shop production, not campaigns

### Gaps

- No public teardown of “invite-only QR platform with **no** product signup” — closest analogs are NFC card admin portals and generic internal IAM. Confidence on **exact** UX copy is MEDIUM; the custody model is consistent across NFC vendors.
- WhatsApp Help Center page could not be fetched (HTTP 400); format taken from search extract of the official FAQ.
- ANPD has not published a QR-scan-specific guide; analog is cookies/logs + Art. 18. Do not over-claim “consent required on every scan.”

---
*Feature research for: PlateFlow internal QR/NFC plate ops (Brazil)*
*Researched: 2026-09-21*
