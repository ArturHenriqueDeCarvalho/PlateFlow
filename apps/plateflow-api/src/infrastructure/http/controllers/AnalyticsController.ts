import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GetAnalyticsUseCase } from '../../../core/use-cases/analytics/GetAnalyticsUseCase.js';

export class AnalyticsController {
  constructor(private getAnalyticsUseCase: GetAnalyticsUseCase) {}

  async getAll(req: FastifyRequest<{ Querystring: { limit?: string } }>, reply: FastifyReply) {
    try {
      const limit = Number(req.query.limit) || 200;
      const logs = await this.getAnalyticsUseCase.execute(limit);
      return reply.send(logs);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Erro ao listar métricas de acesso.' });
    }
  }
}
