import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../middleware/authMiddleware.js';
import { PlateController } from '../controllers/PlateController.js';
import { DrizzlePlateRepository } from '../../database/DrizzlePlateRepository.js';
import { DrizzleRedirectRepository } from '../../database/DrizzleRedirectRepository.js';
import { DrizzleTemplateRepository } from '../../database/DrizzleTemplateRepository.js';
import { GetPlatesUseCase } from '../../../core/use-cases/plates/GetPlatesUseCase.js';
import { CreateBatchPlatesUseCase } from '../../../core/use-cases/plates/CreateBatchPlatesUseCase.js';
import { UpdatePlateUseCase } from '../../../core/use-cases/plates/UpdatePlateUseCase.js';
import { DeletePlateUseCase } from '../../../core/use-cases/plates/DeletePlateUseCase.js';

export const plateRoutes: FastifyPluginAsync = async (app) => {
  const plateRepo = new DrizzlePlateRepository();
  const redirectRepo = new DrizzleRedirectRepository();
  const templateRepo = new DrizzleTemplateRepository();

  const controller = new PlateController(
    new GetPlatesUseCase(plateRepo),
    new CreateBatchPlatesUseCase(plateRepo, redirectRepo, templateRepo),
    new UpdatePlateUseCase(plateRepo),
    new DeletePlateUseCase(plateRepo, redirectRepo)
  );

  app.get('/', (req, reply) => controller.getAll(req, reply));
  app.post('/batch', { preHandler: [requireAuth] }, (req: any, reply) => controller.createBatch(req, reply));
  app.put('/:id', { preHandler: [requireAuth] }, (req: any, reply) => controller.update(req, reply));
  app.delete('/:id', { preHandler: [requireAuth] }, (req: any, reply) => controller.delete(req, reply));
};
