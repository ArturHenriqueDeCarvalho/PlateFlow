import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GetTemplatesUseCase } from '../../../core/use-cases/templates/GetTemplatesUseCase.js';
import type { CreateTemplateUseCase } from '../../../core/use-cases/templates/CreateTemplateUseCase.js';
import type { DeleteTemplateUseCase } from '../../../core/use-cases/templates/DeleteTemplateUseCase.js';

export class TemplateController {
  constructor(
    private getTemplatesUseCase: GetTemplatesUseCase,
    private createTemplateUseCase: CreateTemplateUseCase,
    private deleteTemplateUseCase: DeleteTemplateUseCase
  ) {}

  async getAll(_req: FastifyRequest, reply: FastifyReply) {
    try {
      const templates = await this.getTemplatesUseCase.execute();
      return reply.send(templates);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Erro ao listar templates.' });
    }
  }

  async create(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const created = await this.createTemplateUseCase.execute(req.body as any);
      return reply.status(201).send(created);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || 'Erro ao criar template.' });
    }
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await this.deleteTemplateUseCase.execute(req.params.id);
      return reply.send({ success: true, message: 'Template excluído com sucesso.' });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || 'Erro ao excluir template.' });
    }
  }
}
