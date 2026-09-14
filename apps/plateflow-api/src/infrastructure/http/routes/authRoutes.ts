import type { FastifyPluginAsync } from 'fastify';
import { AuthController } from '../controllers/AuthController.js';

export const authRoutes: FastifyPluginAsync = async (app) => {
  const controller = new AuthController();

  app.post('/login', (req: any, reply) => controller.login(req, reply));
  app.get('/me', (req, reply) => controller.me(req, reply));
};
