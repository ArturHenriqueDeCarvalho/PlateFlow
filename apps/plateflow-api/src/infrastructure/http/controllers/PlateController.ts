import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GetPlatesUseCase } from '../../../core/use-cases/plates/GetPlatesUseCase.js';
import type { CreateBatchPlatesUseCase } from '../../../core/use-cases/plates/CreateBatchPlatesUseCase.js';
import type { UpdatePlateUseCase } from '../../../core/use-cases/plates/UpdatePlateUseCase.js';
import type { DeletePlateUseCase } from '../../../core/use-cases/plates/DeletePlateUseCase.js';
import type { BatchGenerationParams } from '../../../core/entities/index.js';

export class PlateController {
  constructor(
    private getPlatesUseCase: GetPlatesUseCase,
    private createBatchUseCase: CreateBatchPlatesUseCase,
    private updatePlateUseCase: UpdatePlateUseCase,
    private deletePlateUseCase: DeletePlateUseCase
  ) {}

  async getAll(_req: FastifyRequest, reply: FastifyReply) {
    try {
      const plates = await this.getPlatesUseCase.execute();
      return reply.send(plates);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Erro ao listar placas.' });
    }
  }

  async createBatch(req: FastifyRequest<{ Body: BatchGenerationParams }>, reply: FastifyReply) {
    try {
      const result = await this.createBatchUseCase.execute(req.body);
      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || 'Erro ao gerar lote de placas.' });
    }
  }

  async update(req: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) {
    try {
      const updated = await this.updatePlateUseCase.execute(req.params.id, req.body as any);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || 'Erro ao atualizar placa.' });
    }
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await this.deletePlateUseCase.execute(req.params.id);
      return reply.send({ success: true, message: 'Placa excluída com sucesso.' });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || 'Erro ao excluir placa.' });
    }
  }
}
