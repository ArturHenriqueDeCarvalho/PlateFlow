import type { ITemplateRepository } from '../../repositories/ITemplateRepository.js';

export class DeleteTemplateUseCase {
  constructor(private templateRepo: ITemplateRepository) {}

  async execute(id: string): Promise<boolean> {
    const existing = await this.templateRepo.findById(id);
    if (!existing) {
      throw new Error(`Template com ID "${id}" não encontrado.`);
    }

    return this.templateRepo.delete(id);
  }
}
