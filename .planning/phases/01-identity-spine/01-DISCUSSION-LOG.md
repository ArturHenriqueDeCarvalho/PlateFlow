# Phase 1: Identity spine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-21
**Phase:** 1-Identity spine
**Areas discussed:** Where the session lives, How long a login lasts, Where and when to change password, Session dies mid-lot

---

## Where the session lives

| Option | Description | Selected |
|--------|-------------|----------|
| HttpOnly cookie only | Move the session out of JS; `fetch` uses `credentials: 'include'`; delete `localStorage` Bearer keys | ✓ |
| Cookie + Bearer fallback | Cookie for the PWA; API still accepts `Authorization` for scripts | |
| Keep Bearer in `localStorage` | Current `nfc_qr_auth_token_v2` pattern | |

**User's choice:** Cookie httpOnly only (1a), for security — session must not be readable from JavaScript.
**Notes:** User first said the session should be passed to an httpOnly cookie; follow-up confirmed drop Bearer/`localStorage`, not dual transport.

---

## How long a login lasts

| Option | Description | Selected |
|--------|-------------|----------|
| Hard 8h + silent refresh | Short access token; refresh valid until 8h from login; re-login after that | ✓ |
| Sliding 8h window | Each use pushes another 8h (can last days) | |
| 8h access, no refresh | Research default before this discussion | |

**User's choice:** 8 hours plus refresh token so the operator does not drop while navigating (2a).
**Notes:** Refresh is in-window, not a sliding stay-signed-in. Both tokens in HttpOnly cookies.

---

## Where and when to change password

| Option | Description | Selected |
|--------|-------------|----------|
| Account menu in existing Header | Own-password change next to current logout | ✓ |
| Settings screen/modal | Dedicated view | |
| Claude decides placement | Rule matters more than layout | |
| Admin resets anyone now | Would require other users | deferred |

**User's choice:** Admin may change anyone’s password; a user may only change their own. UI for this phase: Header account menu (3a).
**Notes:** Other users are Phase 3. Captured admin-reset-others as deferred; Phase 1 implements own-password (AUTH-03) for the seeded admin.

---

## Session dies mid-lot

| Option | Description | Selected |
|--------|-------------|----------|
| Kick to login immediately | Abort ZIP/canvas | |
| Finish download, then re-auth | Never interrupt in-flight lot; kick only if refresh failed after download | ✓ |
| Keep working on cache | Stay in console without a live session | |

**User's choice:** Wait for the batch process to finish after the user downloads; then kick if there is no refresh token.
**Notes:** Combined with 2a they *have* refresh — silent renew during ZIP; the kick is the failed-refresh fallback only.

---

## Claude's Discretion

- Access-token TTL inside the 8h window, refresh rotation, CSRF mechanism, cookie names, plugin/scrypt wiring (follow research unless it conflicts with locked cookie-only + 8h hard cap).
- Header menu copy/visuals (keep existing zinc console, Portuguese).
- Whether non-secret `AUTH_USER` profile may stay in `localStorage` for paint, provided `/me` is source of truth.

## Deferred Ideas

- Admin password-reset of other users (Phase 3, when users exist)
- AUTH-04 rate-limit/lockout and AUTH-05 forgot-password (v2)
- Forced first-login password change (research v2 defer)
- Unique `plates.slug` / ownership columns (not Phase 1 success criteria)
