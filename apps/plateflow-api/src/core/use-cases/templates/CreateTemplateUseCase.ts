import type { ITemplateRepository } from '../../repositories/ITemplateRepository.js';
import type { PlateTemplate } from '../../entities/index.js';

export class CreateTemplateUseCase {
  constructor(private templateRepo: ITemplateRepository) {}

  async execute(templateData: Partial<PlateTemplate>): Promise<PlateTemplate> {
    if (!templateData.name || !templateData.backgroundUrl) {
      throw new Error('Nome e backgroundUrl são obrigatórios.');
    }

    const id = templateData.id || `tmpl-${Date.now()}`;
    const newTemplate: PlateTemplate = {
      ...templateData,
      id,
      name: templateData.name,
      backgroundUrl: templateData.backgroundUrl,
      description: templateData.description || '',
      backgroundWidth: templateData.backgroundWidth || 1200,
      backgroundHeight: templateData.backgroundHeight || 1600,
      qrX: templateData.qrX || 380,
      qrY: templateData.qrY || 490,
      qrSize: templateData.qrSize || 440,
      createdAt: templateData.createdAt || new Date().toISOString(),
    };

    return this.templateRepo.create(newTemplate);
  }
}
