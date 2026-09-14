import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import { db, seedDefaultTemplates } from '@plateflow/database';
import { authRoutes } from './routes/authRoutes.js';
import { plateRoutes } from './routes/plateRoutes.js';
import { redirectRoutes } from './routes/redirectRoutes.js';
import { templateRoutes } from './routes/templateRoutes.js';
import { analyticsRoutes } from './routes/analyticsRoutes.js';
import { publicRedirectRoutes } from './routes/publicRedirectRoutes.js';

export function createFastifyApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
    trustProxy: true,
  });

  // Plugins
  app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  });

  app.register(formbody);

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

  // Seed default templates in background
  seedDefaultTemplates().catch((err) => {
    console.warn('[Seed warning]:', err.message);
  });

  // Register routes
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(plateRoutes, { prefix: '/api/plates' });
  app.register(redirectRoutes, { prefix: '/api/redirects' });
  app.register(templateRoutes, { prefix: '/api/templates' });
  app.register(analyticsRoutes, { prefix: '/api/analytics' });
  app.register(publicRedirectRoutes);

  return app;
}
