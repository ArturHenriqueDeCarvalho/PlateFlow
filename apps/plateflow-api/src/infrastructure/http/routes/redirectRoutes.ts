import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../middleware/authMiddleware.js';
import { RedirectController } from '../controllers/RedirectController.js';
import { DrizzleRedirectRepository } from '../../database/DrizzleRedirectRepository.js';
import { GetRedirectsUseCase } from '../../../core/use-cases/redirects/GetRedirectsUseCase.js';
import { UpdateRedirectUseCase } from '../../../core/use-cases/redirects/UpdateRedirectUseCase.js';

export const redirectRoutes: FastifyPluginAsync = async (app) => {
  const redirectRepo = new DrizzleRedirectRepository();
  const controller = new RedirectController(
    new GetRedirectsUseCase(redirectRepo),
    new UpdateRedirectUseCase(redirectRepo)
  );

  app.get('/', (req, reply) => controller.getAll(req, reply));
  app.put('/:slug', { preHandler: [requireAuth] }, (req: any, reply) => controller.update(req, reply));
};
