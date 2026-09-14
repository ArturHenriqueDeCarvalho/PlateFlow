import type { FastifyPluginAsync } from 'fastify';
import { AnalyticsController } from '../controllers/AnalyticsController.js';
import { DrizzleAnalyticsRepository } from '../../database/DrizzleAnalyticsRepository.js';
import { GetAnalyticsUseCase } from '../../../core/use-cases/analytics/GetAnalyticsUseCase.js';

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  const analyticsRepo = new DrizzleAnalyticsRepository();
  const controller = new AnalyticsController(new GetAnalyticsUseCase(analyticsRepo));

  app.get('/', (req: any, reply) => controller.getAll(req, reply));
};
