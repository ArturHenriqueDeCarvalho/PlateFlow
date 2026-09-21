import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createFastifyApp } from '../infrastructure/http/app.js';

process.env.NODE_ENV = 'test';
if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
  process.env.JWT_SECRET = 'plateflow-test-jwt-secret-32bytes!';
}
if (!process.env.ADMIN_EMAIL) process.env.ADMIN_EMAIL = 'admin@plateflow.com';
if (!process.env.ADMIN_PASSWORD) process.env.ADMIN_PASSWORD = 'plateflow2026';
if (!process.env.APP_ORIGIN) process.env.APP_ORIGIN = 'http://localhost:3005';

const FOREIGN_ORIGIN = 'https://evil.example';
const FORGED_BEARER = 'Bearer mock_token_admin_1';

type InjectResponse = {
  statusCode: number;
  headers: Record<string, unknown>;
  body: string;
  json: () => unknown;
};

function setCookieLines(res: InjectResponse): string[] {
  const header = res.headers['set-cookie'];
  if (header == null) return [];
  return Array.isArray(header) ? header.map(String) : [String(header)];
}

function cookieJarFrom(res: InjectResponse): Record<string, string> {
  const jar: Record<string, string> = {};
  for (const line of setCookieLines(res)) {
    const pair = line.split(';', 1)[0];
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    jar[pair.slice(0, eq).trim()] = pair.slice(eq + 1);
  }
  return jar;
}

function cookieLine(res: InjectResponse, name: string): string | undefined {
  return setCookieLines(res).find((line) => line.toLowerCase().startsWith(`${name.toLowerCase()}=`));
}

function assertHttpOnlyCookie(res: InjectResponse, name: string): string {
  const line = cookieLine(res, name);
  assert.ok(line, `expected Set-Cookie for ${name}`);
  assert.match(line, /;\s*HttpOnly/i, `${name} must be HttpOnly`);
  const value = line.split(';', 1)[0].slice(name.length + 1);
  assert.ok(value.length > 0, `${name} must have a value`);
  return value;
}

function isLoginJson(res: InjectResponse): boolean {
  try {
    const body = res.json() as { error?: unknown };
    return typeof body?.error === 'string' && /login|sessão|sessao|credencial|não autorizado|nao autorizado/i.test(body.error);
  } catch {
    return false;
  }
}

function assertNoIpKey(value: unknown, path = '$'): void {
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertNoIpKey(item, `${path}[${i}]`));
    return;
  }
  if (value && typeof value === 'object') {
    assert.equal(
      Object.prototype.hasOwnProperty.call(value, 'ip'),
      false,
      `${path} must not include an ip key`,
    );
    for (const [key, nested] of Object.entries(value)) {
      assertNoIpKey(nested, `${path}.${key}`);
    }
  }
}

const app = createFastifyApp();

async function login(email = process.env.ADMIN_EMAIL!, password = process.env.ADMIN_PASSWORD!) {
  return app.inject({
    method: 'POST',
    url: '/api/auth/login',
    headers: { 'content-type': 'application/json' },
    payload: { email, password },
  });
}

before(async () => {
  await app.ready();
});

after(async () => {
  await app.close();
});

it('AUTH-01 login sets cookies and /me', async () => {
  const loginRes = await login();
  assert.equal(loginRes.statusCode, 200);
  const body = loginRes.json() as { user?: unknown; token?: unknown };
  assert.ok(body.user, 'login JSON must include user');
  assert.equal(body.token, undefined, 'login JSON must not include a token field');
  assertHttpOnlyCookie(loginRes, 'plateflow_access');
  assertHttpOnlyCookie(loginRes, 'plateflow_refresh');

  const me = await app.inject({
    method: 'GET',
    url: '/api/auth/me',
    cookies: cookieJarFrom(loginRes),
  });
  assert.equal(me.statusCode, 200);
});

it('AUTH-01 forged bearer 401 on GET plates', async () => {
  const getPlates = await app.inject({
    method: 'GET',
    url: '/api/plates',
    headers: { authorization: FORGED_BEARER },
  });
  assert.equal(getPlates.statusCode, 401);

  const putPlate = await app.inject({
    method: 'PUT',
    url: '/api/plates/forged-id',
    headers: { authorization: FORGED_BEARER, 'content-type': 'application/json' },
    payload: { title: 'forged' },
  });
  assert.equal(putPlate.statusCode, 401);
});

it('AUTH-01 missing cookie 401 on GET plates', async () => {
  const res = await app.inject({ method: 'GET', url: '/api/plates' });
  assert.equal(res.statusCode, 401);
});

it('AUTH-01 refresh rotates within 8h', async () => {
  const loginRes = await login();
  const first = cookieJarFrom(loginRes);
  assert.ok(first.plateflow_refresh, 'login must set plateflow_refresh');

  const refreshRes = await app.inject({
    method: 'POST',
    url: '/api/auth/refresh',
    cookies: first,
  });
  assert.equal(refreshRes.statusCode, 200);
  const rotated = cookieJarFrom(refreshRes);
  assert.ok(rotated.plateflow_access, 'refresh must set plateflow_access');
  assert.ok(rotated.plateflow_refresh, 'refresh must set plateflow_refresh');
  assert.notEqual(rotated.plateflow_refresh, first.plateflow_refresh);

  const stale = await app.inject({
    method: 'POST',
    url: '/api/auth/refresh',
    cookies: { plateflow_refresh: first.plateflow_refresh },
  });
  assert.equal(stale.statusCode, 401);
});

it('AUTH-01 logout clears cookies', async () => {
  const loginRes = await login();
  const cookies = cookieJarFrom(loginRes);
  const logoutRes = await app.inject({
    method: 'POST',
    url: '/api/auth/logout',
    cookies,
  });
  assert.equal(logoutRes.statusCode, 200);
  const cleared = setCookieLines(logoutRes);
  assert.ok(
    cleared.some((line) => /plateflow_access=.*(Max-Age=0|expires=Thu, 01 Jan 1970)/i.test(line)),
    'logout must clear plateflow_access',
  );
  assert.ok(
    cleared.some((line) => /plateflow_refresh=.*(Max-Age=0|expires=Thu, 01 Jan 1970)/i.test(line)),
    'logout must clear plateflow_refresh',
  );

  const me = await app.inject({
    method: 'GET',
    url: '/api/auth/me',
    cookies,
  });
  assert.equal(me.statusCode, 401);
});

it('AUTH-03 change password then login', async () => {
  const originalPassword = process.env.ADMIN_PASSWORD!;
  const nextPassword = 'plateflow-test-new-pass-01';

  const loginRes = await login();
  const cookies = cookieJarFrom(loginRes);
  assert.ok(cookies.plateflow_refresh, 'login must set plateflow_refresh');

  const wrongCurrent = await app.inject({
    method: 'POST',
    url: '/api/auth/change-password',
    cookies,
    headers: { 'content-type': 'application/json' },
    payload: {
      currentPassword: 'not-the-current-password',
      newPassword: nextPassword,
    },
  });
  assert.ok(
    wrongCurrent.statusCode === 400 || wrongCurrent.statusCode === 401,
    `wrong current must be 400/401, got ${wrongCurrent.statusCode}`,
  );
  const wrongBody = wrongCurrent.json() as { error?: string };
  assert.equal(wrongBody.error, 'Senha atual incorreta.');

  const changeRes = await app.inject({
    method: 'POST',
    url: '/api/auth/change-password',
    cookies,
    headers: { 'content-type': 'application/json' },
    payload: {
      currentPassword: originalPassword,
      newPassword: nextPassword,
    },
  });
  assert.equal(changeRes.statusCode, 200);
  const newCookies = cookieJarFrom(changeRes);
  assertHttpOnlyCookie(changeRes, 'plateflow_access');
  assertHttpOnlyCookie(changeRes, 'plateflow_refresh');
  assert.notEqual(
    newCookies.plateflow_refresh,
    cookies.plateflow_refresh,
    'change-password must issue a new refresh cookie',
  );

  const staleRefresh = await app.inject({
    method: 'POST',
    url: '/api/auth/refresh',
    cookies: { plateflow_refresh: cookies.plateflow_refresh },
  });
  assert.equal(staleRefresh.statusCode, 401);

  const meStill = await app.inject({
    method: 'GET',
    url: '/api/auth/me',
    cookies: newCookies,
  });
  assert.equal(meStill.statusCode, 200, 'operator stays signed in on new cookie pair');

  const relogin = await login(process.env.ADMIN_EMAIL, nextPassword);
  assert.equal(relogin.statusCode, 200);
  assertHttpOnlyCookie(relogin, 'plateflow_access');

  const oldLogin = await login(process.env.ADMIN_EMAIL, originalPassword);
  assert.equal(oldLogin.statusCode, 401);
  const oldBody = oldLogin.json() as { error?: string };
  assert.equal(oldBody.error, 'Credenciais inválidas.');

  // Restore seed password so later suite tests keep working.
  const restore = await app.inject({
    method: 'POST',
    url: '/api/auth/change-password',
    cookies: cookieJarFrom(relogin),
    headers: { 'content-type': 'application/json' },
    payload: {
      currentPassword: nextPassword,
      newPassword: originalPassword,
    },
  });
  assert.equal(restore.statusCode, 200);
});

it('ANLY-04 analytics 401 and no ip', async () => {
  const unauth = await app.inject({ method: 'GET', url: '/api/analytics' });
  assert.equal(unauth.statusCode, 401);

  const { DrizzleAnalyticsRepository } = await import(
    '../infrastructure/database/DrizzleAnalyticsRepository.js'
  );
  const seeded = await new DrizzleAnalyticsRepository().create({
    id: `anly04-seed-${Date.now()}`,
    redirectSlug: 'anly04-seed-slug',
    slug: 'anly04-seed-slug',
    source: 'qr',
    referrer: 'test',
    userAgent: 'anly04-agent',
    deviceType: 'Desktop',
    device: 'Desktop',
    browser: 'test',
    os: 'test',
    ip: '203.0.113.50',
    timestamp: new Date().toISOString(),
  });
  assert.ok(seeded.id, 'seed create must persist a row (ip may remain in DB)');

  const loginRes = await login();
  const authed = await app.inject({
    method: 'GET',
    url: '/api/analytics',
    cookies: cookieJarFrom(loginRes),
  });
  assert.equal(authed.statusCode, 200);
  const body = authed.json();
  assert.ok(Array.isArray(body) && body.length > 0, 'GET must return at least the seeded log');
  assertNoIpKey(body);
});

it('ANLY-04 inventory GETs 401', async () => {
  const templates = await app.inject({ method: 'GET', url: '/api/templates' });
  assert.equal(templates.statusCode, 401);
  const redirects = await app.inject({ method: 'GET', url: '/api/redirects' });
  assert.equal(redirects.statusCode, 401);
});

it('SHOP-01 batch persist cookie gate', async () => {
  const now = new Date().toISOString();
  const slug = `shop01-${Date.now().toString(36)}-01`;
  const fixture = {
    plates: [
      {
        id: `plate-shop01-${Date.now()}`,
        slug,
        templateId: 'tpl-shop01',
        batchIdentifier: 'SHOP01',
        plateNumber: 1,
        customerNotes: 'Placa #01',
        nfcWritten: false,
        createdAt: now,
      },
    ],
    redirects: [
      {
        slug,
        type: 'url',
        title: 'Placa #01',
        destinationUrl: '',
        status: 'virgin',
        clicks: 0,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };

  const unauth = await app.inject({
    method: 'POST',
    url: '/api/plates/batch',
    headers: { 'content-type': 'application/json' },
    payload: fixture,
  });
  assert.equal(unauth.statusCode, 401);

  const loginRes = await login();
  const authed = await app.inject({
    method: 'POST',
    url: '/api/plates/batch',
    cookies: cookieJarFrom(loginRes),
    headers: { 'content-type': 'application/json' },
    payload: fixture,
  });
  // CreateBatch returns 201; accept any 2xx for the cookie gate.
  assert.ok(
    authed.statusCode >= 200 && authed.statusCode < 300,
    `expected 2xx with cookies, got ${authed.statusCode}: ${authed.body}`,
  );
});

it('SCAN safety public /r/:slug', async () => {
  const res = await app.inject({ method: 'GET', url: '/r/missing-slug-xyz' });
  assert.notEqual(res.statusCode, 401);
  assert.equal(isLoginJson(res), false, 'public scan must not return login JSON');
});

it('CORS foreign origin', async () => {
  const res = await app.inject({
    method: 'OPTIONS',
    url: '/api/auth/login',
    headers: {
      origin: FOREIGN_ORIGIN,
      'access-control-request-method': 'POST',
    },
  });
  const allowOrigin = res.headers['access-control-allow-origin'];
  assert.notEqual(allowOrigin, FOREIGN_ORIGIN);
});

it('AUTH-01 foreign Origin mutation 403', async () => {
  const mutations: Array<{ method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'; url: string }> = [
    { method: 'POST', url: '/api/auth/login' },
    { method: 'PUT', url: '/api/plates/foreign-id' },
    { method: 'PATCH', url: '/api/plates/foreign-id' },
    { method: 'DELETE', url: '/api/plates/foreign-id' },
  ];

  for (const { method, url } of mutations) {
    const res = await app.inject({
      method,
      url,
      headers: {
        origin: FOREIGN_ORIGIN,
        'content-type': 'application/json',
      },
      payload: method === 'DELETE' ? undefined : { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
    });
    assert.equal(res.statusCode, 403, `${method} ${url} must reject foreign Origin`);
    const body = res.json() as { error?: unknown };
    assert.equal(typeof body.error, 'string');
    assert.match(String(body.error), /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]|não|Não|origem|proibid/i);
  }
});
