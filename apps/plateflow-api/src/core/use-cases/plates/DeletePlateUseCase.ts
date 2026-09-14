import type { IPlateRepository } from '../../repositories/IPlateRepository.js';
import type { IRedirectRepository } from '../../repositories/IRedirectRepository.js';

export class DeletePlateUseCase {
  constructor(
    private plateRepo: IPlateRepository,
    private redirectRepo: IRedirectRepository
  ) {}

  async execute(id: string): Promise<boolean> {
    const plate = await this.plateRepo.findById(id);
    if (!plate) {
      throw new Error(`Placa com ID "${id}" não encontrada.`);
    }

    // Delete plate and corresponding redirect if present
    await this.plateRepo.delete(id);
    if (plate.slug) {
      await this.redirectRepo.deleteBySlug(plate.slug).catch(() => {});
    }

    return true;
  }
}
