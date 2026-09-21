# Roadmap: PlateFlow

## Overview

PlateFlow already prints lots, writes NFC, and resolves `/r/:slug`. This milestone adds a real identity spine so the gráfica admin can provision internal users, each operator only manages created-or-assigned plates, and a scan still hits the current destination — without rebuilding the print console or opening the shop as SaaS.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Identity spine** - Signed JWT, locked inventory GETs, IP off the wire, print console still works
- [ ] **Phase 2: Public scan hardening** - `/r/:slug` is the only resolver; HTML and schemes are safe
- [ ] **Phase 3: Users and ownership** - Admin-provisioned users; SQL slice on every list/edit
- [ ] **Phase 4: Operator slice** - Destinations, NFC, PNG/SVG, and slice ZIP for the right owner
- [ ] **Phase 5: Campaigns and privacy** - Campaign grouping, scoped analytics, operational LGPD

## Phase Details

### Phase 1: Identity spine
**Goal:** Operators reach the console only with a signed session, inventory is no longer public, and the admin print console still generates lots.
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** AUTH-01, AUTH-03, ANLY-04, SHOP-01
**Success Criteria** (what must be TRUE):
  1. Admin can log in from the existing login screen, stay signed in, log out, and return via `/me`; a forged `mock_token_admin_*` is rejected.
  2. A logged-in operator can change their own password and then sign in with the new password.
  3. Opening inventory or analytics without a session is refused; readings in the UI never show IP.
  4. After the auth swap, admin can still manage plate templates and generate print lots with QR stamped on artwork.
**Plans:** TBD
**UI hint:** yes

### Phase 2: Public scan hardening
**Goal:** Anyone with a plate reaches the live destination only through `GET /r/:slug`, with safe public HTML and a privacy-policy link.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** SCAN-01, SCAN-02, SCAN-03, SCAN-04
**Success Criteria** (what must be TRUE):
  1. A scan or NFC tap of a live slug reaches the current destination (redirect for URL/WhatsApp/social; HTML landing for Pix/vCard) without logging in.
  2. If the SPA is served at `/r/:slug`, the visitor does not get a fake 404 from empty localStorage — the server is the only resolver.
  3. Public Pix/vCard pages do not run injected markup from destination fields; destinations only follow `http:`, `https:`, and official `wa.me` links.
  4. The public scan page footer links to the privacy policy.
**Plans:** TBD
**UI hint:** yes

### Phase 3: Users and ownership
**Goal:** Admin-created users only see and change QRs they created or were assigned; admin still sees everything.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** AUTH-02, OWN-01, OWN-02, OWN-03, OWN-04
**Success Criteria** (what must be TRUE):
  1. Admin can create a user (email + initial password) and deactivate them from the console; there is no public signup form.
  2. Each QR/plate has a creator and may have an assigned user; admin can assign, unassign, and transfer creator ownership.
  3. A logged-in user only lists, edits, and opens NFC/download/analytics for QRs they created or were assigned — another operator’s inventory is hidden.
  4. Admin can still list every QR/plate; a deactivated user cannot keep using the console.
**Plans:** TBD
**UI hint:** yes

### Phase 4: Operator slice
**Goal:** An assigned operator can retarget their plates, write NFC in their slice, and download QR art without seeing the rest of the shop.
**Mode:** mvp
**Depends on:** Phase 2, Phase 3
**Requirements:** DEST-01, DEST-02, DEST-03, DEST-04, DEST-05, NFC-01, NFC-02, NFC-03, NFC-04, DL-01, DL-02, DL-03, DL-04
**Success Criteria** (what must be TRUE):
  1. A user can create and edit URL, WhatsApp, Pix, vCard, and social destinations for QRs in their slice from the destination form.
  2. A user on Chrome Android can write NFC only for slugs in their slice; the tag stores `/r/{slug}?src=nfc`, the printed QR stays `/r/{slug}`, and `nfcWritten` is set only after a successful read-back.
  3. Desktop and iOS show copy-URL plus “use Chrome on Android” and do not pretend Web NFC works.
  4. A user can download PNG and SVG of the short-URL QR, and plate-art ZIP only for plates in their slice; admin can still download stamped lot ZIP.
**Plans:** TBD
**UI hint:** yes

### Phase 5: Campaigns and privacy
**Goal:** Operators group QRs into campaigns, read slice analytics, and export readings without IP; the privacy policy is public.
**Mode:** mvp
**Depends on:** Phase 3, Phase 4
**Requirements:** CAMP-01, CAMP-02, CAMP-03, CAMP-04, ANLY-01, ANLY-02, ANLY-03, PRIV-01, PRIV-02, PRIV-03
**Success Criteria** (what must be TRUE):
  1. User/admin can group QRs into a named campaign that is not a print lot, add or remove members, and delete the campaign without taking member QRs offline.
  2. Admin sees all campaigns; a user sees only campaigns they created or that contain a QR in their slice, including campaign scan totals in that slice.
  3. User/admin can filter readings by date range and see device breakdown plus QR vs NFC counts within their slice.
  4. Anyone can open the public privacy policy page (linked from login and `/r/:slug`); user/admin can export readings as JSON/CSV without IP.
  5. Admin can deactivate or delete an account; public `/r/:slug` keeps resolving until the destination is paused.
**Plans:** TBD
**UI hint:** yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Identity spine | 0/TBD | Not started | - |
| 2. Public scan hardening | 0/TBD | Not started | - |
| 3. Users and ownership | 0/TBD | Not started | - |
| 4. Operator slice | 0/TBD | Not started | - |
| 5. Campaigns and privacy | 0/TBD | Not started | - |
