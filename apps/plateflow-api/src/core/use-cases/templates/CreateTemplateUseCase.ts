import type { ITemplateRepository } from '../../repositories/ITemplateRepository.js';
import type { PlateTemplate } from '../../entities/index.js';

export class CreateTemplateUseCase {
  constructor(private templateRepo: ITemplateRepository) {}

  async execute(templateData: Omit<PlateTemplate, 'id' | 'createdAt'>): Promise<PlateTemplate> {
    if (!templateData.name || !templateData.backgroundUrl) {
      throw new Error('Nome e backgroundUrl são obrigatórios.');
    }

    const id = `tmpl-${Date.now()}`;
    const newTemplate: PlateTemplate = {
      ...templateData,
      id,
      createdAt: new Date().toISOString(),
    };

    return this.templateRepo.create(newTemplate);
  }
}
