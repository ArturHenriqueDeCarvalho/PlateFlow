import type { IRedirectRepository } from '../../repositories/IRedirectRepository.js';
import type { DynamicRedirect } from '../../entities/index.js';

export class GetRedirectsUseCase {
  constructor(private redirectRepo: IRedirectRepository) {}

  async execute(): Promise<DynamicRedirect[]> {
    return this.redirectRepo.findAll();
  }
}
