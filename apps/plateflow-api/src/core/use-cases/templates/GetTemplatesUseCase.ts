import type { ITemplateRepository } from '../../repositories/ITemplateRepository.js';
import type { PlateTemplate } from '../../entities/index.js';

export class GetTemplatesUseCase {
  constructor(private templateRepo: ITemplateRepository) {}

  async execute(): Promise<PlateTemplate[]> {
    return this.templateRepo.findAll();
  }
}
