# Requirements: PlateFlow

**Defined:** 2026-09-21
**Core Value:** Quem tem a placa (QR ou NFC) chega no destino atual, e o dono certo consegue trocar esse destino e ver as leituras — sem enxergar o inventário dos outros.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: Admin and user can log in, log out, and call `/me` with a signed JWT; `mock_token_admin_*` no longer authenticates
- [ ] **AUTH-02**: Admin can create a user (email + initial password) and deactivate that user; there is no public signup
- [ ] **AUTH-03**: A logged-in user can change their own password

### Ownership

- [ ] **OWN-01**: Each QR/plate has a creator (`owner`) and may have an assigned user
- [ ] **OWN-02**: List, edit, NFC, download, and analytics APIs return only the caller's slice (created ∪ assigned) unless the caller is admin
- [ ] **OWN-03**: Admin can list everything and assign/unassign a user on a QR/plate
- [ ] **OWN-04**: Admin can transfer creator ownership of a QR/plate

### Destinations

- [ ] **DEST-01**: User can create and edit a URL destination (HTTP 307) for QRs in their slice
- [ ] **DEST-02**: User can create and edit a WhatsApp destination via `https://wa.me/{digits}` for QRs in their slice
- [ ] **DEST-03**: User can create and edit a Pix destination that renders a public landing with BR Code (printed QR still encodes `/r/:slug` only)
- [ ] **DEST-04**: User can create and edit a vCard destination (HTML preview + `.vcf` download) for QRs in their slice
- [ ] **DEST-05**: User can create and edit a `social` destination for QRs in their slice

### Public scan

- [ ] **SCAN-01**: A scan/tap resolves only through `GET /r/:slug` (307 for URL/WhatsApp/social; HTML for Pix/vCard)
- [ ] **SCAN-02**: The SPA `/r/:slug` localStorage fallback is removed so a missed rewrite cannot serve a fake 404 from empty cache
- [ ] **SCAN-03**: Public HTML escapes interpolated fields; destinations allow only `http:`, `https:`, and official `wa.me` links
- [ ] **SCAN-04**: The public scan page footer links to the privacy policy

### NFC

- [ ] **NFC-01**: User can write an NFC tag only for slugs in their slice (Chrome on Android, HTTPS, user gesture)
- [ ] **NFC-02**: Written NFC payload is `/r/{slug}?src=nfc`; printed QR encodes `/r/{slug}` without `src` so scans count as `qr`
- [ ] **NFC-03**: `nfcWritten` is set only after a successful read-back of the tag
- [ ] **NFC-04**: Desktop and iOS show copy-URL plus “use Chrome on Android”; they do not pretend Web NFC works

### Downloads

- [ ] **DL-01**: User can download a PNG of the short-URL QR for slugs in their slice
- [ ] **DL-02**: User can download an SVG of the short-URL QR for slugs in their slice
- [ ] **DL-03**: Admin can still download stamped plate-art ZIP for print lots
- [ ] **DL-04**: User can download plate-art ZIP only for plates in their slice

### Campaigns

- [ ] **CAMP-01**: User/admin can group QRs into a named campaign that is not `batchIdentifier`
- [ ] **CAMP-02**: Admin sees all campaigns; a user sees only campaigns they created or that contain a QR in their slice
- [ ] **CAMP-03**: User/admin can add/remove a QR from a campaign; deleting a campaign does not delete member QRs
- [ ] **CAMP-04**: User/admin can see campaign scan totals within their slice

### Analytics

- [ ] **ANLY-01**: User/admin can filter readings by date range within their slice
- [ ] **ANLY-02**: User/admin can see a device breakdown (iOS / Android / Desktop / Other) within their slice
- [ ] **ANLY-03**: User/admin can see QR vs NFC source counts within their slice
- [x] **ANLY-04**: Inventory and analytics GETs require auth; response DTOs and UI omit IP (IP may remain in the database)

### Privacy

- [ ] **PRIV-01**: Anyone can open a public privacy policy page (linked from login and `/r/:slug`)
- [ ] **PRIV-02**: User can export readings in their slice as JSON/CSV without IP; admin can export any slice they select
- [ ] **PRIV-03**: Admin can deactivate/delete an account; public `/r/:slug` keeps resolving until the destination is paused

### Print shop (admin)

- [x] **SHOP-01**: Admin can manage plate templates and generate print lots with QR stamped on artwork

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication

- **AUTH-04**: Login rate-limit and persisted lockout after failed attempts
- **AUTH-05**: Password reset / forgot-password flow
- **AUTH-06**: Invite-by-email (still admin-gated, not public signup)

### Privacy

- **PRIV-04**: User/admin can delete scan logs in their slice

### Ownership

- **OWN-05**: Admin can assign an entire print lot to a user in one action

### Analytics

- **ANLY-05**: Approximate location (city/UF via IP)
- **ANLY-06**: Automatic analytics retention job

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Recurring billing / plans / paywall | Internal tool; v1 has no revenue model |
| Feature lock at end of plan | Depends on billing |
| Public self-serve signup / multi-tenant SaaS | Only admin creates users |
| Consent banner on `/r/:slug` | Scan must not bounce; LGPD controls are console + policy |
| IP, full UA, or city in the UI | Operational LGPD: date + device + source only |
| `NDEFReader.makeReadOnly()` chip lock | Irreversible; typo bricks the plate |
| iOS NFC write via Web NFC | Chrome Android only; iOS needs a native app |
| Cascade-delete QRs when deleting a campaign | Physical plates in the wild would 404 |
| Gemini / `@google/genai` | Declared unused; not part of the product |
| Better Auth / Supabase Auth / Argon2 on Vercel | Research: keep Fastify JWT + scrypt |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 3 | Pending |
| AUTH-03 | Phase 1 | Pending |
| OWN-01 | Phase 3 | Pending |
| OWN-02 | Phase 3 | Pending |
| OWN-03 | Phase 3 | Pending |
| OWN-04 | Phase 3 | Pending |
| DEST-01 | Phase 4 | Pending |
| DEST-02 | Phase 4 | Pending |
| DEST-03 | Phase 4 | Pending |
| DEST-04 | Phase 4 | Pending |
| DEST-05 | Phase 4 | Pending |
| SCAN-01 | Phase 2 | Pending |
| SCAN-02 | Phase 2 | Pending |
| SCAN-03 | Phase 2 | Pending |
| SCAN-04 | Phase 2 | Pending |
| NFC-01 | Phase 4 | Pending |
| NFC-02 | Phase 4 | Pending |
| NFC-03 | Phase 4 | Pending |
| NFC-04 | Phase 4 | Pending |
| DL-01 | Phase 4 | Pending |
| DL-02 | Phase 4 | Pending |
| DL-03 | Phase 4 | Pending |
| DL-04 | Phase 4 | Pending |
| CAMP-01 | Phase 5 | Pending |
| CAMP-02 | Phase 5 | Pending |
| CAMP-03 | Phase 5 | Pending |
| CAMP-04 | Phase 5 | Pending |
| ANLY-01 | Phase 5 | Pending |
| ANLY-02 | Phase 5 | Pending |
| ANLY-03 | Phase 5 | Pending |
| ANLY-04 | Phase 1 | Complete |
| PRIV-01 | Phase 5 | Pending |
| PRIV-02 | Phase 5 | Pending |
| PRIV-03 | Phase 5 | Pending |
| SHOP-01 | Phase 1 | Complete |

**Coverage:**

- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-09-21*
*Last updated: 2026-09-21 after roadmap creation*
