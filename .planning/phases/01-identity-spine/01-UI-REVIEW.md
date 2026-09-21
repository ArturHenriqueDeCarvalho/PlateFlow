# Phase 1 — UI Review

**Audited:** 2026-09-21
**Baseline:** `.planning/phases/01-identity-spine/01-UI-SPEC.md` (approved)
**Screenshots:** captured (LoginScreen only) — `.planning/ui-reviews/01-20260921-170837/{desktop,mobile,tablet}.png`. Live host was `http://localhost:3005` (unified `pnpm dev`; ports 3000 / 5173 / 8080 were down). Headless session had no cookie, so Header account menu and Alterar senha Modal were not photographed. Modal portal fix audited in code.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Locked Portuguese strings match UI-SPEC; dismiss CTA remains generic **Cancelar** (checker FLAG carried through). |
| 2. Visuals | 2/4 | LoginScreen hierarchy is clear; mobile account chip is an icon-only control with no accessible name. |
| 3. Color | 3/4 | 60/30/10 zinc split holds on LoginScreen; Modal backdrop is hardcoded `bg-black/80` instead of zinc. |
| 4. Typography | 2/4 | Password-modal description is `text-xs` (Label) not Body `text-sm`; form actions inherit `font-medium` (500). |
| 5. Spacing | 3/4 | Account menu matches the locked Header density; Modal header/footer still use 14px (`py-3.5`) half-steps. |
| 6. Experience Design | 3/4 | Auth/password/D-07 states are covered; `Toast` stays mounted when `message` is null. |

**Overall: 16/24**

---

## Top 3 Priority Fixes

1. **Unnamed mobile account chip** — Below `md`, the disclosure is only a `Lock` icon with `aria-hidden` and no `aria-label`, so assistive tech (and many users) cannot identify the account menu. — Add `aria-label="Conta"` (or the email) on the chip button in `Header.tsx`; keep the visual Lock if desired.
2. **Password-modal type scale violates the contract** — Description is 12px Label, and Cancelar / field-error inherit weight 500, so the new AUTH-03 surface does not use the declared 4-size / 2-weight system. — In `Modal.tsx` change description to `text-sm font-normal leading-normal`; on the password footer/errors force `font-semibold` or `font-normal` (do not restyle frozen Header/KPI).
3. **Empty Toast chrome always painted** — Authenticated `App` always renders `<Toast message={toastMessage} />`, so a success/error shell sits at the bottom with no copy until the first toast. — Render Toast only when `toastMessage` is a non-empty string (and optionally auto-dismiss **Senha alterada.**).

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**WARNING** — Contract strings for the new AUTH-03 surface are implemented correctly. The remaining gaps are the spec’s own generic dismiss and leftover competing login copy.

| Element | UI-SPEC | Implemented | Verdict |
|---------|---------|-------------|---------|
| Login CTA | **Entrar** | `LoginScreen.tsx:99` | Pass |
| Login labels / placeholders | **E-mail**, **Senha**, `seu@email.com`, `••••••••` | `LoginScreen.tsx:71-87` | Pass |
| Login card header | **Acesso ao Painel** | `LoginScreen.tsx:56` | Pass |
| Login error fallback | **Credenciais inválidas.** | `LoginScreen.tsx:34` | Pass |
| Modal title / description | **Alterar senha** / **Informe a senha atual e escolha uma nova.** | `Header.tsx:332-333` | Pass |
| Password fields | **Senha atual**, **Nova senha**, **Confirmar nova senha** | `Header.tsx:368-393` | Pass |
| Submit / menu | **Alterar senha** | `Header.tsx:240`, `Header.tsx:353` | Pass |
| Dismiss | **Cancelar** + close **Fechar modal** | `Header.tsx:343`, `Modal.tsx:94` | Pass (generic) |
| Logout | **Sair** + `aria-label` **Sair da conta** + `title` **Encerrar sessão** | `Header.tsx:250-254` | Pass |
| Success toast | **Senha alterada.** | `App.tsx:404` | Pass |
| Mismatch / wrong current | **A nova senha e a confirmação não conferem.** / **Senha atual incorreta.** | `Header.tsx:33`, `Header.tsx:117` | Pass |
| Readings empty | **Nenhuma leitura registrada** + locked body | `DashboardOverview.tsx:118-119` | Pass |

- **WARNING:** `Cancelar` (`Header.tsx:343`) is the UI-SPEC-approved dismiss and the checker’s Dimension 1 FLAG. It does not say what is cancelled. Prefer **Manter senha atual** if copy can move; until then this stays a known quality drag, not a contract miss.
- **WARNING:** `LoginModal.tsx:38` still says **Credenciais inválidas. Tente novamente.** and `LoginModal.tsx:132` **Entrar no Painel**. The file is unused (`App.tsx` gates on `LoginScreen` only), but it is competing Portuguese if remounted. Do not wire it back.
- Live screenshots confirm LoginScreen copy and that Header **Entrar** is unreachable while the gate is on (no header chrome on `:3005`).

### Pillar 2: Visuals (2/4)

**WARNING** — LoginScreen has a single focal point (brand mark → card → **Entrar**). The new Header disclosure does not.

- **WARNING:** Account chip (`Header.tsx:215-226`) has `aria-haspopup` / `aria-expanded` but no `aria-label` / `aria-controls`. Email prefix is `hidden md:inline`; the mobile `Lock` is `aria-hidden`. Result: an icon-only button with an empty accessible name. UI-SPEC Visuals assumed the chip as the entry; it did not waive a name.
- **WARNING:** Mobile chip uses the same `Lock` as **Alterar senha**, so the control reads as “security” rather than “account.” A `User` / email initial, or a visible **Conta** label, would match the disclosure job.
- **Pass:** Menu panel matches the chip language: `absolute right-0 mt-2 z-50 min-w-[180px] rounded-lg border-zinc-700 bg-zinc-900 py-1` (`Header.tsx:230-231`). Items use `Lock` 14px (`h-3.5`) `text-zinc-400` and `LogOut` with rose hover — not accent.
- **Pass (regression):** `Modal.tsx:58-60,113` portals to `document.body` so `position: fixed` is not trapped by Header `sticky` + `backdrop-blur-sm` (`Header.tsx:129`). Alterar senha is no longer clipped by the header containing block. Not live-verified (no session).
- **WARNING:** Authenticated shell always mounts Toast chrome (`App.tsx:389` + `Toast.tsx:19-36`) — a second floating focal point with no message. `needs_human_review: true` for brand feel of the empty toast on a logged-in dashboard.
- Icon-only close on Modal has `aria-label="Fechar modal"` (`Modal.tsx:94`). Logout row has name + title. Only the chip fails the icon-only rule.
- LoginScreen screenshots (1440 / 768 / 375): centered `max-w-sm` Card, QrCode 40×40 mark, Display **PlateFlow**, no inventory/Header leak. Card header band is sparse (label-only) but matches the frozen Card + LoginScreen layout.

### Pillar 3: Color (3/4)

**WARNING** — Accent reservation holds on Phase 1 auth chrome; overlay and toast introduce extra hues.

- LoginScreen screenshots: dominant `#09090b` canvas, secondary zinc-900 card, accent only on **Entrar** (`bg-zinc-100 text-zinc-950`). Matches the 60/30/10 table.
- Password submit uses `Button variant="primary"` (`Header.tsx:345-353`) — reserved accent #2. Menu items and icons stay zinc, not `bg-zinc-100`.
- **Novo Lote** remains primary (frozen reserved #3). Nav tabs use zinc-800 selected, not accent (`Header.tsx:149-152`).
- Error banners match the contract: `border-rose-500/20 bg-rose-500/10 text-rose-300` + `AlertCircle` `text-rose-400` (`Header.tsx:359`, `LoginScreen.tsx:62`). Logout hover `hover:text-rose-400` (`Header.tsx:249`). Destructive rose is not used as a primary fill on this surface.
- Input focus is `focus:ring-zinc-400` (`Input.tsx:36`) — not accent, as required.
- **WARNING:** Modal backdrop is `bg-black/80` (`Modal.tsx:68`), a hardcoded non-zinc overlay. Prefer `bg-zinc-950/80` to stay on the token set.
- **WARNING:** Success Toast icons use `text-emerald-600` (`Toast.tsx:14`). UI-SPEC said reuse the existing toast (so this is not a new accent), but it still breaks the zinc + rose-only auth palette when **Senha alterada.** appears.
- `text-primary` / `bg-primary` / `border-primary`: **0** hits in `apps/plateflow-app/src` (no shadcn tokens). Hardcoded hex in touched auth UI: none in `Header.tsx` / `LoginScreen.tsx`; Modal uses `bg-black/80`. `index.css` body `#09090b` / `#f4f4f5` is the locked canvas.

### Pillar 4: Typography (2/4)

**WARNING** — LoginScreen uses the four allowed roles. The new password modal does not.

UI-SPEC for new/touched auth UI: Label 12/600, Body 14/400, Heading 16/600, Display 18/600; weights **400 and 600 only**.

| Surface | Classes | Contract | Verdict |
|---------|---------|----------|---------|
| Login brand | `text-lg font-semibold` (`LoginScreen.tsx:46`) | Display 18/600 | Pass |
| Acesso ao Painel | `text-xs font-semibold uppercase tracking-wider` (`LoginScreen.tsx:55`) | Label 12/600 | Pass |
| Field labels | `text-xs font-semibold` (`Input.tsx:21`) | Label | Pass |
| Field values | `text-sm` (`Input.tsx:36`) | Body | Pass |
| Modal title | `text-base font-semibold` (`Modal.tsx:81`) | Heading 16/600 | Pass |
| Modal description | `text-xs … font-normal` (`Modal.tsx:85`) | Body `text-sm` 14/400 | **Fail** |
| Menu items | `text-xs font-semibold` (`Header.tsx:237`) | Label | Pass |
| Email chip | `font-mono font-normal` (`Header.tsx:222`) | Allowed; mono reserved for prefix | Pass |
| Error banner | `text-xs` (`Header.tsx:359`) | Label | Pass |
| Confirm error | `text-xs … font-medium` (`Input.tsx:52`) | 400 or 600 only | **Fail** |
| Cancelar (outline) | Button base + outline `font-medium` (`Button.tsx:30,44`) | 400 or 600 only | **Fail** |
| Alterar senha (primary) | `font-medium` + `font-semibold` concatenated (`Button.tsx:30,40`) | 600 — unresolved without `twMerge` | **Risk** |

Sizes in new auth UI: `text-xs`, `text-sm`, `text-base`, `text-lg` (four — within contract). Weights actually applied: `font-normal`, `font-medium`, `font-semibold` (and frozen Header brand `font-bold`). **`font-medium` is the extra weight the contract forbade on the password form.**

Line-height: title uses `leading-snug` (~1.375) vs Heading 1.2; description uses `leading-relaxed` vs Body 1.5. Secondary to the size miss.

Do not restyle PageHeader / KPI `text-2xl`/`text-3xl` `font-bold` — those remain frozen and were not copied into the menu or modal.

### Pillar 5: Spacing (3/4)

**WARNING** — New menu chrome follows the Header-density exception. Modal chrome still uses off-scale 14px.

Declared scale: 4 / 8 / 16 / 24 / 32 (multiples of 4), plus locked Header exceptions (`px-2`/`px-2.5`, `py-1`, `gap-1.5`, item `px-3 py-2`, `min-h-[32px]` / `min-h-[44px]`, menu `min-w-[180px]`).

- **Pass:** Menu items `gap-1`, `px-3 py-2`, `min-h-[44px] md:min-h-[32px]` (`Header.tsx:237-249`). Panel `py-1`, `min-w-[180px]`, `mt-2`. Chip `px-2 sm:px-2.5 py-1 gap-1.5`. Form `space-y-4` (`Header.tsx:365`). Error banner `gap-2`, `mb-4`, `p-3`.
- **Pass:** Modal body `px-4 sm:px-6 py-4 sm:py-5` (`Modal.tsx:101`) matches “reuse existing Modal padding.”
- **WARNING:** Modal header `py-3.5 sm:py-4` (`Modal.tsx:79`) and footer `py-3 sm:py-3.5` / `gap-2.5` (`Modal.tsx:107`) use 14px / 10px — not on the 4px scale. Pre-existing Modal, but this is the AUTH-03 surface. Footer actions in Header use `gap-2` (`Header.tsx:335`) inside a footer that also sets `gap-2.5`.
- **WARNING:** Input stack `space-y-1.5` (`Input.tsx:17`) is 6px (Header-density-like, not in the form scale). Acceptable for frozen Input; do not add more `*.5` on new wrappers.
- Arbitrary values in new Header UI are the declared exceptions (`min-h-[44px]`, `min-h-[32px]`, `min-w-[180px]`, `max-w-[100px]`). Modal `max-h-[calc(100dvh-…)]` is existing overflow chrome.
- LoginScreen screenshots: `p-4` canvas, `mb-8` brand, `space-y-4` fields — matches md/xl usage. No overflow at 375.

### Pillar 6: Experience Design (3/4)

**WARNING** — State matrix from UI-SPEC §UI Considerations is largely implemented. Two defects degrade the logged-in chrome.

| State | Contract | Evidence | Verdict |
|-------|----------|----------|---------|
| E1 login loading | `isLoading` disables double submit | `Button.tsx:54` `disabled={disabled \|\| isLoading}`; `LoginScreen.tsx:96` | Pass |
| E1 login error | Rose banner + fallback | `LoginScreen.tsx:61-65` | Pass |
| E1 empty / partial | Native `required`; no EmptyState | `LoginScreen.tsx:73,84` | Pass |
| E2 password loading | Submit `isLoading`; Cancelar disabled; close blocked | `Header.tsx:90-93,336-351` | Pass |
| E2 mismatch | Field error; no POST | `Header.tsx:101-104,399` | Pass |
| E2 API error | Same rose banner | `Header.tsx:358-362` | Pass |
| E2 success | Close modal, toast, stay in console | `Header.tsx:122-125`, `App.tsx:403-405` | Pass |
| E2 401 | LoginScreen, no extra toast | `Header.tsx:108-113`, `App.tsx:406-409` | Pass |
| E3 menu | Click-outside + Escape; open modal closes menu | `Header.tsx:55-73,84-87` | Pass |
| E5 auth gate | Spinner only on zinc-950; no Header | `App.tsx:357-362`; screenshot = LoginScreen only | Pass |
| E5 `!user` | Only LoginScreen | `App.tsx:368-376`; `onOpenLogin={() => {}}` | Pass |
| E4 readings | Columns Placa / Dispositivo / Data e Horário; no `log.ip` | `DashboardOverview.tsx:164-166`; `log.ip` grep = 0 | Pass |
| E6 D-07 | `batchInFlight` / `pendingLogout`; LoginScreen after processing | `App.tsx:58-60,143-148,574` | Pass (code; `needs_human_review: true` for mid-ZIP expiry) |

- **WARNING:** `App.tsx:389` mounts Toast unconditionally. `Toast.tsx` has no `if (!message) return null`. Empty status chrome is always in the authenticated tree.
- **WARNING:** Modal has Escape + backdrop close but no focus trap or initial focus on the first field. After portal-to-body, Tab still walks Header/nav behind the dialog. Not required by a UI-SPEC row, but it is the AUTH-03 surface.
- **Pass:** No logout confirm dialog (locked). No “Esqueci a senha.” No “sessão expirada” interstitial on pendingLogout.
- **Pass:** `autocomplete="current-password"` / `new-password` on the three fields (`Header.tsx:371-396`).
- Registry safety: not applicable — `components.json` absent; UI-SPEC Registry table is empty. No Experience deduction.

---

## Files Audited

- `.planning/phases/01-identity-spine/01-UI-SPEC.md`
- `.planning/phases/01-identity-spine/01-CONTEXT.md`
- `.planning/phases/01-identity-spine/01-01-SUMMARY.md` … `01-06-SUMMARY.md`
- `apps/plateflow-app/src/components/Header.tsx`
- `apps/plateflow-app/src/components/LoginScreen.tsx`
- `apps/plateflow-app/src/components/ui/Modal.tsx`
- `apps/plateflow-app/src/components/ui/Button.tsx`
- `apps/plateflow-app/src/components/ui/Input.tsx`
- `apps/plateflow-app/src/components/ui/Toast.tsx`
- `apps/plateflow-app/src/components/ui/EmptyState.tsx`
- `apps/plateflow-app/src/components/ui/Card.tsx`
- `apps/plateflow-app/src/App.tsx`
- `apps/plateflow-app/src/components/DashboardOverview.tsx`
- `apps/plateflow-app/src/components/BatchGeneratorModal.tsx` (D-07 `onProcessingChange` only)
- `apps/plateflow-app/src/index.css`
- `apps/plateflow-app/src/components/LoginModal.tsx` (dead competing copy)

Screenshots: `.planning/ui-reviews/01-20260921-170837/` (gitignored binaries).
