# PlateFlow

## What This Is

PlateFlow é uma ferramenta **interna** de gráfica para placas físicas com QR Code e NFC de destino dinâmico. Um **admin** opera o console inteiro (lotes, templates, usuários, todos os QRs). **Usuários internos** — criados só pelo admin, sem cadastro público — controlam apenas os QRs que eles criaram ou que o admin atribuiu: destino, NFC, campanhas, downloads e leituras.

O scan público continua em `/r/:slug`. Destinos no v1: URL, WhatsApp, Pix e vCard.

## Core Value

Quem tem a placa (QR ou NFC) chega no destino **atual**, e o dono certo consegue **trocar esse destino** e ver as leituras — sem enxergar o inventário dos outros.

## Business Context

- **Customer**: A própria gráfica (uso interno; não é SaaS aberto neste marco)
- **Revenue model**: Fora do v1 — sem cobrança recorrente
- **Success metric**: Admin cria usuários; cada um só opera o recorte dele; scan e edição de destino funcionam de ponta a ponta
- **Strategy notes**: Evolução de um console single-admin já existente, não um produto novo do zero

## Requirements

### Validated

- ✓ Destino dinâmico por slug (`url`, `whatsapp`, `pix`, `vcard`, `social`) com edição posterior — existing
- ✓ Resolução pública `GET /r/:slug` (307 ou HTML Pix/vCard) — existing
- ✓ Status virgin / active / paused — existing
- ✓ Lote de placas + template com QR carimbado na arte (PNG/ZIP no browser) — existing
- ✓ Gravação NFC (Web NFC / Chrome Android) do URL `/r/{slug}` + flag `nfcWritten` — existing
- ✓ Analytics de scan (timestamp, device, UA, source qr/nfc, IP no banco) — existing, incompleto vs v1
- ✓ Login admin por credencial de ambiente — Phase 1 (JWT + cookies; `mock_token_admin_*` rejeitado)
- ✓ Auth real (sessão/JWT assinado); substituir token prefix-guessable — Phase 1
- ✓ Troca de senha do próprio operador no Header (AUTH-03) — Phase 1
- ✓ GETs de inventário/analytics autenticados; IP não aparece na UI — Phase 1
- ✓ Console de lote/templates continua gerando ZIP após o swap de auth (SHOP-01) — Phase 1

### Active

- [ ] Cadastro interno de usuários exclusivo do admin (criar, desativar; sem signup público)
- [ ] Dono do QR + atribuição pelo admin; isolamento de listagem e NFC
- [ ] Usuário cria e edita QR URL / WhatsApp / Pix / vCard no recorte dele
- [ ] Campanhas como agrupamento de QRs (admin vê tudo; usuário só as dele)
- [ ] Download PNG e SVG do QR (além da arte de placa já existente)
- [ ] Painel de leituras por data, dispositivo e fonte (QR vs NFC), só no recorte
- [ ] Política de privacidade + exportar/apagar leituras (e contas, no admin)
- [ ] Página pública `/r/:slug` alinhada a campanha/dono (não fallback SPA em localStorage)

### Out of Scope

- Cobrança recorrente / planos / paywall — recorte interno; v1 sem billing
- Bloqueio ou redução de recursos no fim do plano — depende de billing
- Localização aproximada (cidade/UF via IP ou GPS) — painel só data + dispositivo
- Cadastro público / self-service / multi-tenant SaaS — só admin cria contas
- Consentimento no scan público e retenção automática de eventos — LGPD “pesada” adiada
- NFC em iOS (Web NFC não cobre) — v1 permanece Chrome/Android
- Gemini / `@google/genai` — declarado e não usado; não entra no produto

## Context

Brownfield mapeado em `.planning/codebase/` (2026-09-20). Monorepo pnpm/Turbo: PWA React 19 (`apps/plateflow-app`) + API Fastify Clean Architecture (`apps/plateflow-api`) + Postgres/Drizzle (`packages/database`) + tipos (`packages/types`). Host unificado `server.ts`; produção Vercel (`api/index.ts`, `/api/*` e `/r/*`).

O código já entrega o fluxo de gráfica (lote, template, NFC, redirects) **e a spine de identidade do v1**: JWT + cookies, inventário/analytics atrás de sessão, IP fora da UI, troca de senha no Header. Falta **autorização por dono** (fases 3–4) e o endurecimento do scan público (fase 2).

Dívida conhecida (não é o core value, mas ainda bloqueia o v1 seguro): HTML público sem escape, CORS/origins a endurecer no scan, `plates.slug` unique só na spine.

## Constraints

- **Tech stack**: TypeScript, React 19, Fastify 5, Vite 6, Tailwind 4, Drizzle + `pg`, pnpm 11 — já no repo; não trocar de stack neste marco
- **Database**: Postgres (Supabase como host SQL, sem `@supabase/supabase-js` / Auth)
- **NFC**: Web NFC no Chrome/Android; usuário só grava slugs do recorte dele
- **Auth model**: Admin total; usuário = QRs criados + atribuídos; sem papéis além desses dois no v1
- **Privacy**: LGPD operacional no v1 (política, auth nas listagens, IP fora da UI, export/delete); sem billing de dado
- **Compat**: Destinos WhatsApp / Pix / vCard permanecem; `social` existente no código não foi pedido no v1 (não evoluir)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Ferramenta interna, não SaaS aberto | Admin cria usuários; ninguém se cadastra sozinho | — Pending |
| Dois papéis: admin vs usuário com dono/atribuição | Usuário não vê inventário alheio; NFC no recorte | — Pending |
| Sem cobrança no v1 | Billing não se aplica ao recorte interno agora | — Pending |
| Sem geolocalização no v1 | Painel = data + dispositivo (+ fonte QR/NFC) | — Pending |
| WhatsApp, Pix, vCard no v1 | Já existem; mesma regra de dono que URL | — Pending |
| LGPD operacional, não “pesada” | Política + auth + IP oculto + export/delete; sem consentimento no scan | — Pending |
| Manter lotes/templates da gráfica no admin | Console atual continua sendo o da gráfica | — Pending |
| Substituir mock token por auth real | Prefix `mock_token_admin_` é bypass | Phase 1 — JWT + cookies HttpOnly |
| Postgres/Drizzle, não Supabase Auth | Persistência já é `pg`; Auth SDK não é usado | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-21 after Phase 1*
