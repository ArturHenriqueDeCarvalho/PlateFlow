import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { db, seedDefaultTemplates } from '@plateflow/database';
import { authRoutes } from './routes/authRoutes.js';
import { plateRoutes } from './routes/plateRoutes.js';
import { redirectRoutes } from './routes/redirectRoutes.js';
import { templateRoutes } from './routes/templateRoutes.js';
import { analyticsRoutes } from './routes/analyticsRoutes.js';
import { publicRedirectRoutes } from './routes/publicRedirectRoutes.js';
import { ACCESS_COOKIE } from '../auth/sessionCookies.js';
import { assertIdentityEnv, seedAdminUser } from '../auth/seedAdminUser.js';
import { requireOrigin } from './middleware/requireOrigin.js';

function parseAppOrigins(): string[] {
  return (process.env.APP_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createFastifyApp() {
  assertIdentityEnv();

  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
    trustProxy: true,
    bodyLimit: 10 * 1024 * 1024, // 10MB
  });

  // Handle payload too large error cleanly
  app.setErrorHandler((error: any, _request, reply) => {
    if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
      return reply.status(413).send({
        error: 'Payload Too Large',
        message: 'O tamanho da imagem ou dados enviados excede o limite suportado pelo servidor.',
      });
    }
    reply.send(error);
  });

  const allowedOrigins = parseAppOrigins();
  app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }
      cb(null, allowedOrigins.includes(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  });

  app.register(formbody, { bodyLimit: 10 * 1024 * 1024 });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required.');
  }

  app.register(cookie);
  app.register(jwt, {
    secret: jwtSecret,
    cookie: {
      cookieName: ACCESS_COOKIE,
      signed: false,
    },
  });

  // CSRF: SameSite Lax cookies + Origin allowlist on mutations (never global jwtVerify)
  app.addHook('onRequest', requireOrigin);

  // Health check endpoint
  app.get('/api/health', async (_req, reply) => {
    try {
      await db.execute('SELECT 1');
      return reply.send({
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return reply.status(503).send({
        status: 'degraded',
        database: 'error',
        error: err.message,
      });
    }
  });

  // Seed default templates and admin in background if database URL is configured
  if (process.env.DATABASE_URL) {
    seedDefaultTemplates().catch((err) => {
      console.warn('[Seed warning]:', err.message);
    });
    app.addHook('onReady', async () => {
      try {
        await seedAdminUser();
      } catch (err: any) {
        console.warn('[Seed warning]:', err.message);
        if (process.env.NODE_ENV === 'test') throw err;
      }
    });
  }

  // Register routes
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(plateRoutes, { prefix: '/api/plates' });
  app.register(redirectRoutes, { prefix: '/api/redirects' });
  app.register(templateRoutes, { prefix: '/api/templates' });
  app.register(analyticsRoutes, { prefix: '/api/analytics' });
  app.register(publicRedirectRoutes);

  return app;
}
