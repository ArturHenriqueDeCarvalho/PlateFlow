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
  const targetRoute = req.query?.__route || req.headers?.['x-forwarded-uri'];
  if (targetRoute && typeof targetRoute === 'string') {
    const [routePath, routeQuery] = targetRoute.split('?');
    const existingParams = new URLSearchParams(routeQuery || '');
    for (const [key, value] of Object.entries(req.query || {})) {
      if (key !== '__route' && typeof value === 'string') {
        existingParams.set(key, value);
      }
    }
    const fullQuery = existingParams.toString();
    req.url = fullQuery ? `${routePath}?${fullQuery}` : routePath;
  }

  await ensureReady();
  app.server.emit('request', req, res);
}

if (process.argv[1]?.includes('apps/plateflow-api')) {
  const PORT = Number(process.env.PORT) || 3005;
  app.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
    console.log(`⚡ PlateFlow Clean API listening on port ${PORT}`);
  }).catch((err) => {
    console.error('Error starting server:', err);
  });
}
