import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GetRedirectsUseCase } from '../../../core/use-cases/redirects/GetRedirectsUseCase.js';
import type { UpdateRedirectUseCase } from '../../../core/use-cases/redirects/UpdateRedirectUseCase.js';

export class RedirectController {
  constructor(
    private getRedirectsUseCase: GetRedirectsUseCase,
    private updateRedirectUseCase: UpdateRedirectUseCase
  ) {}

  async getAll(_req: FastifyRequest, reply: FastifyReply) {
    try {
      const redirects = await this.getRedirectsUseCase.execute();
      return reply.send(redirects);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Erro ao listar redirecionamentos.' });
    }
  }

  async update(req: FastifyRequest<{ Params: { slug: string }; Body: any }>, reply: FastifyReply) {
    try {
      const updated = await this.updateRedirectUseCase.execute(req.params.slug, req.body as any);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || 'Erro ao atualizar redirecionamento.' });
    }
  }
}
