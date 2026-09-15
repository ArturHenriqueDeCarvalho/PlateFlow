import 'dotenv/config';
import { createFastifyApp } from './infrastructure/http/app.js';

export const app = createFastifyApp();

let isReady = false;
async function ensureReady() {
  if (!isReady) {
    await app.ready();
    isReady = true;
  }
}

export default async function handler(req: any, res: any) {
  try {
    const targetRoute = req.query?.__route || req.headers?.['x-forwarded-uri'];
    let targetUrl = req.url || '/';
    if (targetRoute && typeof targetRoute === 'string') {
      const [routePath, routeQuery] = targetRoute.split('?');
      const existingParams = new URLSearchParams(routeQuery || '');
      for (const [key, value] of Object.entries(req.query || {})) {
        if (key !== '__route' && typeof value === 'string') {
          existingParams.set(key, value);
        }
      }
      const fullQuery = existingParams.toString();
      targetUrl = fullQuery ? `${routePath}?${fullQuery}` : routePath;
    }

    await ensureReady();

    const headers = { ...(req.headers || {}) };
    delete headers['content-length'];

    let payload: any = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined && req.body !== null) {
      if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
        payload = JSON.stringify(req.body);
        if (!headers['content-type']) {
          headers['content-type'] = 'application/json';
        }
      } else {
        payload = req.body;
      }
    }

    const response = await app.inject({
      method: req.method || 'GET',
      url: targetUrl,
      headers,
      payload,
    });

    for (const [key, value] of Object.entries(response.headers)) {
      if (value !== undefined) {
        res.setHeader(key, value);
      }
    }
    res.statusCode = response.statusCode;
    res.end(response.rawPayload);
  } catch (err: any) {
    console.error('[Vercel Handler Error]:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Erro interno no servidor' }));
  }
}

if (process.argv[1]?.includes('apps/plateflow-api') && !process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3005;
  app.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
    console.log(`⚡ PlateFlow Clean API listening on port ${PORT}`);
  }).catch((err) => {
    console.error('Error starting server:', err);
  });
}
