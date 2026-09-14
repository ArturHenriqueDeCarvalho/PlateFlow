import type { IPlateRepository } from '../../repositories/IPlateRepository.js';
import type { PhysicalPlate } from '../../entities/index.js';

export class UpdatePlateUseCase {
  constructor(private plateRepo: IPlateRepository) {}

  async execute(id: string, updates: Partial<PhysicalPlate>): Promise<PhysicalPlate> {
    const existing = await this.plateRepo.findById(id);
    if (!existing) {
      throw new Error(`Placa com ID "${id}" não encontrada.`);
    }

    const updated = await this.plateRepo.update(id, updates);
    if (!updated) {
      throw new Error(`Falha ao atualizar placa com ID "${id}".`);
    }

    return updated;
  }
}
