---
status: complete
phase: 01-identity-spine
source: [01-VERIFICATION.md]
started: 2026-09-21T19:32:15Z
updated: 2026-09-21T20:01:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cookie login on unified host
expected: On the unified host, submit LoginScreen with seeded admin. Console appears after /me; inventory loads; a logged-out tab does not show Header.
result: pass

### 2. Password change from Header
expected: Log in, open Header account menu, change password with current password. Copy matches UI-SPEC; toast Senha alterada.; still on the console; Sair still works.
result: pass

### 3. D-07 ZIP-then-login
expected: Start a print lot; confirm ZIP still downloads if access expires mid-compose. LoginScreen only after download; never during progress bar. Templates and Novo Lote still work.
result: pass

### 4. Judgment-tier prohibitions
expected: No public signup; failed /me does not restore cached inventory shell; no IP in operator UI; non-punitive copy; ZIP not discarded for LoginScreen.
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
