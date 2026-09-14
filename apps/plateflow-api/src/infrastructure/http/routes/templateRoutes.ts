import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../middleware/authMiddleware.js';
import { TemplateController } from '../controllers/TemplateController.js';
import { DrizzleTemplateRepository } from '../../database/DrizzleTemplateRepository.js';
import { GetTemplatesUseCase } from '../../../core/use-cases/templates/GetTemplatesUseCase.js';
import { CreateTemplateUseCase } from '../../../core/use-cases/templates/CreateTemplateUseCase.js';
import { DeleteTemplateUseCase } from '../../../core/use-cases/templates/DeleteTemplateUseCase.js';

export const templateRoutes: FastifyPluginAsync = async (app) => {
  const templateRepo = new DrizzleTemplateRepository();
  const controller = new TemplateController(
    new GetTemplatesUseCase(templateRepo),
    new CreateTemplateUseCase(templateRepo),
    new DeleteTemplateUseCase(templateRepo)
  );

  app.get('/', (req, reply) => controller.getAll(req, reply));
  app.post('/', { preHandler: [requireAuth] }, (req: any, reply) => controller.create(req, reply));
  app.delete('/:id', { preHandler: [requireAuth] }, (req: any, reply) => controller.delete(req, reply));
};
