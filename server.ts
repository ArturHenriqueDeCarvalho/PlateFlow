import 'dotenv/config';
import path from 'path';
import { app } from './apps/plateflow-api/src/server.js';

const PORT = Number(process.env.PORT) || 3005;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: path.resolve(process.cwd(), 'apps/plateflow-app'),
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.addHook('onRequest', async (req, reply) => {
      const url = req.raw.url || '';
      // Delegate any non-API and non-shortlink route to Vite dev server
      if (!url.startsWith('/api') && !url.startsWith('/r/')) {
        return new Promise<void>((resolve) => {
          vite.middlewares(req.raw, reply.raw, () => {
            resolve();
          });
        });
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const fs = await import('fs');
    app.setNotFoundHandler(async (req, reply) => {
      const url = req.raw.url || '';
      if (!url.startsWith('/api') && !url.startsWith('/r/')) {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          const html = fs.readFileSync(indexPath, 'utf-8');
          return reply.type('text/html').send(html);
        }
      }
      return reply.status(404).send('Página não encontrada');
    });
  }

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`⚡ PlateFlow Fastify running at http://localhost:${PORT}`);
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export default app;
