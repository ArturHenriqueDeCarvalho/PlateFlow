---
last_mapped_commit: 05d7e8c0cd75d9708d937e833856f04c7c7afdd1
last_mapped_at: 2026-09-20
---
# Testing Patterns

**Analysis Date:** 2026-09-20

## Test Framework

**Runner:**

- Not detected — no `vitest`, `jest`, `mocha`, or `playwright` dependency in root `package.json`, `apps/plateflow-api/package.json`, `apps/plateflow-app/package.json`, `packages/database/package.json`, or `packages/types/package.json`
- No `vitest.config.*`, `jest.config.*`, or `playwright.config.*` in the repo
- Config: Not applicable
- The API already gates Fastify logging with `logger: process.env.NODE_ENV !== 'test'` in `apps/plateflow-api/src/infrastructure/http/app.ts` — set `NODE_ENV=test` in any new test process
- `coverage/` is gitignored in `.gitignore`; no coverage reporter is configured

**Assertion Library:**

- Not detected
- When adding tests, use Vitest (`vitest` + `expect`) for unit/integration — it matches the Vite + ESM + TypeScript stack in `apps/plateflow-app/vite.config.ts` and `"type": "module"` packages
- Use Playwright for browser E2E (GSD `/gsd-add-tests` classifies UI flows as E2E)

**Run Commands:**

```bash
pnpm lint                          # tsc --noEmit via turbo (only existing quality gate)

# After adding Vitest at the package that owns the code:

pnpm --filter @plateflow/api test  # API unit + Fastify inject
pnpm --filter @plateflow/app test  # app unit
pnpm --filter @plateflow/api test:watch
pnpm --filter @plateflow/api test -- --coverage
```

There is no `test` script today. Add one next to `lint` in the package under test; do not invent a root test runner until a workspace tool is added.

## Test File Organization

**Location:**

- No `*.test.*`, `*.spec.*`, `__tests__/`, or `e2e/` files exist under `apps/` or `packages/`
- Colocate new unit tests next to the source file: `CreateBatchPlatesUseCase.test.ts` beside `CreateBatchPlatesUseCase.ts`
- Put Fastify inject tests under `apps/plateflow-api/src/infrastructure/http/` (for example `app.test.ts` next to `app.ts`)
- Put app service tests beside the service: `apps/plateflow-app/src/services/storageService.test.ts`
- Put Playwright specs in `apps/plateflow-app/e2e/` once E2E is introduced

**Naming:**

- Use `*.test.ts` for API/package units
- Use `*.test.tsx` for React component units
- Use `*.spec.ts` only for Playwright E2E

**Structure:**

```
apps/plateflow-api/src/
├── core/use-cases/plates/CreateBatchPlatesUseCase.ts
├── core/use-cases/plates/CreateBatchPlatesUseCase.test.ts
├── infrastructure/services/PixCodeService.ts
├── infrastructure/services/PixCodeService.test.ts
├── infrastructure/http/app.ts
└── infrastructure/http/app.test.ts
apps/plateflow-app/src/
├── services/storageService.ts
├── services/storageService.test.ts
└── components/ui/Button.tsx
apps/plateflow-app/e2e/
└── login.spec.ts
packages/database/src/
├── client.ts
└── client.test.ts
```

## Test Structure

**Suite Organization:**
No live suite exists. Write new Vitest files in this shape, matching constructor injection in `GetPlatesUseCase.ts` and `UpdateRedirectUseCase.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { UpdateRedirectUseCase } from './UpdateRedirectUseCase.js';
import type { IRedirectRepository } from '../../repositories/IRedirectRepository.js';
import type { DynamicRedirect } from '../../entities/index.js';

function makeRedirect(overrides: Partial<DynamicRedirect> = {}): DynamicRedirect {
  return {
    slug: 'placa-01',
    type: 'url',
    title: 'Placa #01',
    destinationUrl: 'https://example.com',
    status: 'active',
    clicks: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('UpdateRedirectUseCase', () => {
  it('throws when the slug does not exist', async () => {
    const redirectRepo: IRedirectRepository = {
      findAll: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(null),
      createBatch: vi.fn(),
      update: vi.fn(),
      incrementClicks: vi.fn(),
      deleteBySlug: vi.fn(),
      deleteBatchBySlugs: vi.fn(),
    };

    const useCase = new UpdateRedirectUseCase(redirectRepo);

    await expect(useCase.execute('missing', { title: 'Novo' })).rejects.toThrow(
      'Redirecionamento com slug "missing" não encontrado.'
    );
  });
});
```

**Patterns:**

- Setup: construct a stub that implements the `I*Repository` port; pass it to `new {UseCase}(repo)`
- Teardown: none required for pure use-case tests; call `await app.close()` after Fastify inject suites
- Assertion: assert Portuguese `Error` messages exactly as thrown in the use case; assert HTTP `{ error }` bodies and status codes on controllers/routes
- Classify files the GSD way (`/.cursor/skills/gsd-add-tests/SKILL.md`): TDD = pure/transform/validate; E2E = browser user flows; Skip = types, route wiring, schema-only files

## Mocking

**Framework:** Not detected. Use Vitest `vi.fn()` / `vi.spyOn()` when tests are added.

**Patterns:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ResolveRedirectUseCase } from './ResolveRedirectUseCase.js';
import type { IRedirectRepository } from '../../repositories/IRedirectRepository.js';
import type { IAnalyticsRepository } from '../../repositories/IAnalyticsRepository.js';

describe('ResolveRedirectUseCase', () => {
  it('returns null when the slug is unknown', async () => {
    const redirectRepo = {
      findBySlug: vi.fn().mockResolvedValue(null),
      incrementClicks: vi.fn(),
    } as unknown as IRedirectRepository;
    const analyticsRepo = { create: vi.fn() } as unknown as IAnalyticsRepository;

    const result = await new ResolveRedirectUseCase(redirectRepo, analyticsRepo).execute('nope');

    expect(result).toBeNull();
    expect(analyticsRepo.create).not.toHaveBeenCalled();
  });
});
```

**What to Mock:**

- `IPlateRepository`, `IRedirectRepository`, `ITemplateRepository`, `IAnalyticsRepository` in use-case tests — these ports exist specifically for substitution
- `fetch` and `localStorage` when testing `StorageService` in `apps/plateflow-app/src/services/storageService.ts`
- `console.error` / `console.warn` only when asserting fire-and-forget analytics/click failures (`ResolveRedirectUseCase.ts`)
- Fastify `req`/`reply` is optional — prefer `app.inject()` over mocking Reply

**What NOT to Mock:**

- Do not mock `generatePixBrCode` or `generateVCardString` — they are pure (`PixCodeService.ts`, `VCardService.ts`)
- Do not mock `sanitizeErrorMessage()` in `packages/database/src/client.ts`
- Do not mock Drizzle query builders inside a repository unit test; if a repository needs a test, use a real or test Postgres and treat it as integration
- Do not mock Tailwind / lucide icons

## Fixtures and Factories

**Test Data:**
Reuse the field shapes from `packages/types/src/index.ts` and the seed-style objects in `apps/plateflow-app/src/data/initialData.ts`. Build factories next to the test file:

```typescript
import type { PhysicalPlate, DynamicRedirect, PlateTemplate } from '@plateflow/types';

export function makePlate(overrides: Partial<PhysicalPlate> = {}): PhysicalPlate {
  return {
    id: 'plate-LOTE-01-abcd',
    slug: 'placa-01',
    templateId: 'tmpl-google-gold',
    batchIdentifier: 'LOTE',
    plateNumber: 1,
    customerNotes: 'Placa #01',
    nfcWritten: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeRedirect(overrides: Partial<DynamicRedirect> = {}): DynamicRedirect {
  return {
    id: 'redir-LOTE-01-abcd',
    slug: 'placa-01',
    type: 'url',
    title: 'Placa #01',
    destinationUrl: '',
    status: 'virgin',
    clicks: 0,
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeTemplate(overrides: Partial<PlateTemplate> = {}): PlateTemplate {
  return {
    id: 'tmpl-google-gold',
    name: 'Placa Acrílica Black & Gold - Google Reviews',
    description: '',
    backgroundUrl: 'data:image/svg+xml;utf8,<svg></svg>',
    backgroundWidth: 1200,
    backgroundHeight: 1600,
    qrX: 380,
    qrY: 490,
    qrSize: 440,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}
```

**Location:**

- Domain factories: `apps/plateflow-api/src/core/test/factories.ts` once more than one suite needs them
- SVG/template fixtures: copy the `data:image/svg+xml` pattern from `apps/plateflow-app/src/data/initialData.ts` and `packages/database/src/client.ts` (`seedDefaultTemplates`)
- Do not import production seed SVGs into every test — keep a tiny SVG string

## Coverage

**Requirements:** None enforced. No nyc/c8/vitest coverage config. `coverage/` is ignored in `.gitignore`.

**View Coverage:**

```bash

# After Vitest is added to the target package:

pnpm --filter @plateflow/api test -- --coverage
```

**Priority targets (highest value first):**

1. `generatePixBrCode` in `apps/plateflow-api/src/infrastructure/services/PixCodeService.ts` (CRC, amount formatting, name/city truncation)
2. `generateVCardString` in `apps/plateflow-api/src/infrastructure/services/VCardService.ts`
3. `sanitizeErrorMessage` / `getDatabaseUrl` host rewriting in `packages/database/src/client.ts` (assert secrets are stripped; do not embed real credentials)
4. `CreateBatchPlatesUseCase` validation + rollback in `apps/plateflow-api/src/core/use-cases/plates/CreateBatchPlatesUseCase.ts`
5. `UpdateRedirectUseCase`, `UpdatePlateUseCase`, `DeletePlateUseCase`, `CreateTemplateUseCase` not-found / required-field errors
6. `ResolveRedirectUseCase` null vs fire-and-forget analytics
7. `requireAuth` in `apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts`
8. Fastify inject on `/api/health`, `/api/auth/login`, `/api/auth/me`, `/r/:slug`
9. `StorageService.getStats` / `recordClick` status machine (`virgin` / `paused` / `ok` / `not_found`)

Skip (GSD Skip class): `packages/types/src/index.ts`, route registration tables, `packages/database/src/schema/index.ts`, `packages/database/src/migrate.ts`, Tailwind-only UI.

## Test Types

**Unit Tests:**

- Scope: use cases, pure helpers, auth middleware, StorageService status logic
- Approach: inject `I*Repository` fakes; call `execute()`; assert return values and thrown Portuguese messages
- First files: `PixCodeService.ts`, `VCardService.ts`, `CreateBatchPlatesUseCase.ts`, `UpdateRedirectUseCase.ts`, `CreateTemplateUseCase.ts`, `authMiddleware.ts`

**Integration Tests:**

- Scope: Fastify routes through `createFastifyApp()` in `apps/plateflow-api/src/infrastructure/http/app.ts`
- Approach: `app.inject({ method, url, headers, payload })` — the Vercel adapter in `apps/plateflow-api/src/server.ts` already uses this API
- Set `NODE_ENV=test` so Fastify logger stays off
- `/api/health` hits `db.execute('SELECT 1')` — either point `DATABASE_URL` at a test database or skip that case without a DB
- Do not boot `server.ts` listen() in tests; `createFastifyApp()` + `inject` is enough
- Close the app after the suite

**E2E Tests:**

- Not used
- When added, use Playwright against the Vite+Fastify dev server from root `server.ts` (`pnpm dev`)
- Cover GSD E2E class flows: login (`LoginScreen.tsx`), batch modal (`BatchGeneratorModal.tsx`), edit redirect (`EditRedirectModal.tsx`), inventory bulk delete (`PlatesInventory.tsx`), public `/r/:slug` states (virgin / paused / pix / url)

## Common Patterns

**Async Testing:**

```typescript
import { describe, it, expect } from 'vitest';
import { createFastifyApp } from './app.js';

describe('createFastifyApp', () => {
  it('rejects unauthenticated batch create', async () => {
    const app = createFastifyApp();
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/api/plates/batch',
      payload: { plates: [] },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: 'Não autorizado. Faça login como administrador para realizar alterações.',
    });

    await app.close();
  });
});
```

Token shape under test must match `requireAuth` in `apps/plateflow-api/src/infrastructure/http/middleware/authMiddleware.ts`: `Authorization: Bearer mock_token_admin_<anything>`.

**Error Testing:**

```typescript
import { describe, it, expect } from 'vitest';
import { CreateTemplateUseCase } from './CreateTemplateUseCase.js';
import { CreateBatchPlatesUseCase } from '../plates/CreateBatchPlatesUseCase.js';

it('rejects a template without name or background', async () => {
  const useCase = new CreateTemplateUseCase({
    findAll: async () => [],
    findById: async () => null,
    create: async (t) => t,
    delete: async () => true,
  });

  await expect(useCase.execute({})).rejects.toThrow('Nome e backgroundUrl são obrigatórios.');
});

it('rejects invalid batch params', async () => {
  const useCase = new CreateBatchPlatesUseCase(
    {} as never,
    {} as never,
    {} as never
  );

  await expect(useCase.execute({})).rejects.toThrow(
    'Parâmetros inválidos para geração em lote.'
  );
});
```

**Pure helper testing:**

```typescript
import { describe, it, expect } from 'vitest';
import { generatePixBrCode } from './PixCodeService.js';
import { generateVCardString } from './VCardService.js';
import { sanitizeErrorMessage } from '@plateflow/database';

it('embeds the Pix key and a CRC trailer', () => {
  const code = generatePixBrCode('chave@pix.com', 'Cafe Central', 'Sao Paulo', 10);
  expect(code).toContain('br.gov.bcb.pix');
  expect(code).toContain('chave@pix.com');
  expect(code.slice(-4)).toMatch(/^[0-9A-F]{4}$/);
});

it('omits empty vCard fields', () => {
  const vcf = generateVCardString({ name: 'Ana', phone: '11999999999' });
  expect(vcf).toContain('BEGIN:VCARD');
  expect(vcf).toContain('FN:Ana');
  expect(vcf).not.toContain('EMAIL');
});

it('redacts postgres credentials', () => {
  const raw = 'fail postgresql://user:secret@db.example.com/app';
  expect(sanitizeErrorMessage(raw)).toContain('postgresql://***:***@');
  expect(sanitizeErrorMessage(raw)).not.toContain('secret');
});
```

**Client status-machine testing:**

```typescript
// Exercise StorageService.recordClick branches in storageService.ts:
// not_found → { status: 'not_found' }
// virgin or empty destinationUrl → { status: 'virgin' }
// paused → { status: 'paused' }
// active + destinationUrl → increments clicks and { status: 'ok' }
```

**HTTP contract to assert:**
| Endpoint | File | Assert |
|----------|------|--------|
| `GET /api/health` | `apps/plateflow-api/src/infrastructure/http/app.ts` | `200 { status: 'ok', database: 'connected' }` or `503` degraded |
| `POST /api/auth/login` | `apps/plateflow-api/src/infrastructure/http/controllers/AuthController.ts` | `200 { token, user }` or `401 { error }` |
| `GET /api/auth/me` | `AuthController.ts` | `200` with `mock_token_admin_*`, else `401` |
| `POST /api/plates/batch` | `plateRoutes.ts` | `401` without token; `201` with valid body |
| `GET /r/:slug` | `publicRedirectRoutes.ts` | `404` HTML, virgin HTML, paused HTML, `307` for url/whatsapp/social |
| `413` payload | `app.ts` `setErrorHandler` | `{ error: 'Payload Too Large' }` |

**GSD add-tests contract:**

- Follow RED-GREEN: write the assertion, run it, then keep the implementation (`/.cursor/skills/gsd-add-tests/SKILL.md`)
- Do not fix production bugs found by a new test — record them
- Commit message when generated via that command: `test(phase-{N}): add unit and E2E tests from add-tests command`

---

*Testing analysis: 2026-09-20*
