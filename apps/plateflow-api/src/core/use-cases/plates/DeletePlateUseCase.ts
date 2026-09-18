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

  async executeBatch(ids: string[]): Promise<{ count: number }> {
    if (!ids || ids.length === 0) return { count: 0 };
    const plates = await this.plateRepo.findByIds(ids);
    const slugs = plates.map((p) => p.slug).filter(Boolean);

    await this.plateRepo.deleteBatch(ids);
    if (slugs.length > 0) {
      await this.redirectRepo.deleteBatchBySlugs(slugs).catch(() => {});
    }

    return { count: plates.length };
  }
}
