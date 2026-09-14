import type { IRedirectRepository } from '../../repositories/IRedirectRepository.js';
import type { DynamicRedirect } from '../../entities/index.js';

export class UpdateRedirectUseCase {
  constructor(private redirectRepo: IRedirectRepository) {}

  async execute(slug: string, updates: Partial<DynamicRedirect>): Promise<DynamicRedirect> {
    const existing = await this.redirectRepo.findBySlug(slug);
    if (!existing) {
      throw new Error(`Redirecionamento com slug "${slug}" não encontrado.`);
    }

    const updated = await this.redirectRepo.update(slug, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      throw new Error(`Falha ao atualizar redirecionamento com slug "${slug}".`);
    }

    return updated;
  }
}
