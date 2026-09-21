import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../../..');
const apiSrc = join(repoRoot, 'apps/plateflow-api/src');
const appSrc = join(repoRoot, 'apps/plateflow-app/src');

function walkTs(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      out.push(...walkTs(path));
    } else if (name.endsWith('.ts') || name.endsWith('.tsx')) {
      if (name.endsWith('.test.ts') || name.endsWith('.test.tsx')) continue;
      out.push(path);
    }
  }
  return out;
}

function read(relFromRepo: string): string {
  return readFileSync(join(repoRoot, relFromRepo), 'utf8');
}

function extractFn(source: string, name: string): string {
  const start = source.indexOf(name);
  assert.ok(start >= 0, `expected ${name} in source`);
  return source.slice(start, start + 900);
}

describe('SPA and source identity contracts', () => {
  it('AUTH-01 production source has no mock_token_admin_ prefix', () => {
    const hits: string[] = [];
    for (const file of [...walkTs(apiSrc), ...walkTs(appSrc)]) {
      const text = readFileSync(file, 'utf8');
      if (text.includes('mock_token_admin_')) {
        hits.push(relative(repoRoot, file).replaceAll('\\', '/'));
      }
    }
    assert.deepEqual(hits, [], 'mock_token_admin_ must not remain in production source');
  });

  it('AUTH-01 SPA apiFetch uses credentials and never sends Bearer', () => {
    const source = read('apps/plateflow-app/src/services/storageService.ts');
    const apiFetch = extractFn(source, 'async function apiFetch');
    assert.match(apiFetch, /credentials:\s*['"]include['"]/);
    assert.match(apiFetch, /headers\.delete\(\s*['"]Authorization['"]\s*\)/);
    assert.equal(
      /Authorization\s*:\s*['"`]Bearer/.test(source),
      false,
      'SPA must not attach Authorization Bearer',
    );
  });

  it('AUTH-01 SPA nfc_qr_auth_token_v2 is only a delete path', () => {
    const source = read('apps/plateflow-app/src/services/storageService.ts');
    const app = read('apps/plateflow-app/src/App.tsx');
    assert.match(source, /nfc_qr_auth_token_v2/);
    assert.match(source, /removeItem/);
    assert.equal(
      /(?:localStorage\.)?setItem\([^)]*nfc_qr_auth_token_v2/.test(source),
      false,
      'must not write nfc_qr_auth_token_v2',
    );
    assert.equal(
      /(?:safeSetItem|setItem)\(\s*STORAGE_KEYS\.AUTH_TOKEN/.test(source),
      false,
      'must not write STORAGE_KEYS.AUTH_TOKEN',
    );
    assert.equal(
      /nfc_qr_auth_token_v2|plateflow_auth_token/.test(app),
      false,
      'App.tsx must not read leftover Bearer keys',
    );
  });

  it('AUTH-01 SPA logout POSTs /api/auth/logout', () => {
    const source = read('apps/plateflow-app/src/services/storageService.ts');
    const app = read('apps/plateflow-app/src/App.tsx');
    const logout = extractFn(source, 'async logout(');
    assert.match(logout, /\/api\/auth\/logout/);
    assert.match(logout, /POST/);
    assert.match(app, /StorageService\.logout/);
  });

  it('ANLY-04 fetch 401 returns empty lists instead of localStorage inventory', () => {
    const source = read('apps/plateflow-app/src/services/storageService.ts');
    for (const name of ['fetchPlates', 'fetchAnalytics', 'fetchTemplates']) {
      const fn = extractFn(source, `async ${name}(`);
      assert.match(
        fn,
        /status === 401[\s\S]{0,220}return \[\]/,
        `${name} must return [] on 401, not cached inventory`,
      );
    }
  });

  it('ANLY-04 DashboardOverview does not interpolate log.ip', () => {
    const dash = read('apps/plateflow-app/src/components/DashboardOverview.tsx');
    assert.equal(/\blog\.ip\b/.test(dash), false, 'readings UI must not render log.ip');
    assert.match(dash, /Placa/);
    assert.match(dash, /Dispositivo/);
  });

  it('AUTH-03 Header exposes Alterar senha account menu', () => {
    const header = read('apps/plateflow-app/src/components/Header.tsx');
    assert.match(header, /Alterar senha/);
    assert.match(header, /aria-haspopup/);
    const app = read('apps/plateflow-app/src/App.tsx');
    assert.match(app, /Senha alterada\./);
  });

  it('SHOP-01 App.tsx defers LoginScreen with pendingLogout', () => {
    const app = read('apps/plateflow-app/src/App.tsx');
    assert.match(app, /pendingLogout/);
    assert.match(app, /batchInFlight/);
    const handle = extractFn(app, 'const handleBatchCreated');
    assert.equal(
      /nfc_qr_auth_token_v2|plateflow_auth_token/.test(handle),
      false,
      'handleBatchCreated must not read leftover Bearer keys',
    );
  });
});
